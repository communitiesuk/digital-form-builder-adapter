import {CacheService} from "../../../../digital-form-builder/runner/src/server/services";
import Jwt from "@hapi/jwt";
import {DecodedSessionToken} from "../../../../digital-form-builder/runner/src/server/plugins/initialiseSession/types";
import {config} from "../plugins/utils/AdapterConfigurationSchema";
// @ts-ignore
import CatboxRedis from "@hapi/catbox-redis";
// @ts-ignore
import CatboxMemory from "@hapi/catbox-memory";
// @ts-ignore
const Catbox = require('@hapi/catbox');

import Redis from "ioredis";
// @ts-ignore
import Crypto from 'crypto';
import {HapiRequest, HapiServer} from "../types";
import {AdapterFormModel} from "../plugins/engine/models";
import Boom from "boom";
import {FormConfiguration} from "@xgovformbuilder/model";
import {AdapterSchema} from "@communitiesuk/model";

const partition = "cache";
const LOGGER_DATA = {
    class: "AdapterCacheService",
}
const {
    redisHost,
    redisPort,
    redisPassword,
    redisTls,
    isSingleRedis,
    sessionTimeout,
} = config;
let redisUri;

if (process.env.FORM_RUNNER_ADAPTER_REDIS_INSTANCE_URI) {
    redisUri = process.env.FORM_RUNNER_ADAPTER_REDIS_INSTANCE_URI;
}

export const FORMS_KEY_PREFIX = "forms:cache:"

enum ADDITIONAL_IDENTIFIER {
    Confirmation = ":confirmation",
}

export enum FormNamespace {
    Permanent = 'permanent',
    Preview = 'preview'
}

/**
 * Determines which namespace to use based on the request context.
 * If form_session_identifier starts with "preview", use preview namespace.
 * Otherwise, use permanent namespace.
 */
export function getNamespaceFromRequest(request: HapiRequest): FormNamespace {
    const formSessionId = request.query.form_session_identifier as string;
    return formSessionId?.startsWith('preview')
        ? FormNamespace.Preview 
        : FormNamespace.Permanent;
}

export class AdapterCacheService extends CacheService {

    constructor(server: HapiServer) {
        //@ts-ignore
        super(server);
        //@ts-ignore
        server.app.redis = this.getRedisClient()
        //@ts-ignore
        if (!server.app.redis) {
            // starting up the in memory cache
            this.cache.client.start();
            //@ts-ignore
            server.app.inMemoryFormKeys = []
        }
    }

    async activateSession(jwt, request) {
        request.logger.info(`[ACTIVATE-SESSION] jwt ${jwt}`);
        const initialisedSession = await this.cache.get(this.JWTKey(jwt));
        request.logger.info(`[ACTIVATE-SESSION] session details ${initialisedSession}`);
        const {decoded} = Jwt.token.decode(jwt);
        const {payload}: { payload: DecodedSessionToken } = decoded;
        const userSessionKey = {segment: partition, id: `${request.yar.id}:${payload.group}`};
        request.logger.info(`[ACTIVATE-SESSION] session metadata ${userSessionKey}`);
        const {redirectPath} = await super.activateSession(jwt, request);

        let redirectPathNew = redirectPath
        const form_session_identifier = initialisedSession.metadata?.form_session_identifier;
        if (form_session_identifier) {
            userSessionKey.id = `${userSessionKey.id}:${form_session_identifier}`;
            redirectPathNew = `${redirectPathNew}?form_session_identifier=${form_session_identifier}`;
        }

        if (config.overwriteInitialisedSession) {
            request.logger.info("[ACTIVATE-SESSION] Replacing user session with initialisedSession");
            this.cache.set(userSessionKey, initialisedSession, sessionTimeout);
        } else {
            const currentSession = await this.cache.get(userSessionKey);
            const mergedSession = {
                ...currentSession,
                ...initialisedSession,
            };
            request.logger.info("[ACTIVATE-SESSION] Merging user session with initialisedSession");
            this.cache.set(userSessionKey, mergedSession, sessionTimeout);
        }
        request.logger.info(`[ACTIVATE-SESSION] redirect ${redirectPathNew}`);
        const key = this.JWTKey(jwt);
        request.logger.info(`[ACTIVATE-SESSION] drop key ${JSON.stringify(key)}`);
        await this.cache.drop(key);
        return {
            redirectPath: redirectPathNew,
        };
    }

    /**
     * The key used to store user session data against.
     * If there are multiple forms on the same runner instance, for example `form-a` and `form-a-feedback` this will prevent CacheService from clearing data from `form-a` if a user gave feedback before they finished `form-a`
     *
     * @param request - hapi request object
     * @param additionalIdentifier - appended to the id
     */
    //@ts-ignore
    Key(request: HapiRequest, additionalIdentifier?: ADDITIONAL_IDENTIFIER) {
        let id = `${request.yar.id}:${request.params.id}`;

        if (request.query.form_session_identifier) {
            id = `${id}:${request.query.form_session_identifier}`;
        }
        request.logger.info(`[ACTIVATE-SESSION] session key ${id} and segment is ${partition}`);
        return {
            segment: partition,
            id: `${id}${additionalIdentifier ?? ""}`,
        };
    }

    /**
     * Handles form configuration storage in Redis cache with namespace separation.
     * Permanent forms are loaded at startup from the forms directory.
     * Preview forms are published at runtime via the /publish endpoint by Form Designer and FAB.
     * @param formId form id
     * @param configuration form definition configurations
     * @param server server object
     * @param namespace determines whether form is stored in permanent or preview namespace
     */
    async setFormConfiguration(
        formId: string, 
        configuration: any, 
        server: HapiServer,
        namespace: FormNamespace = FormNamespace.Permanent
    ) {
        if (formId && configuration) {
            //@ts-ignore
            if (server.app.redis) {
                await this.addConfigurationsToRedisCache(server, configuration, formId, namespace);
            } else {
                await this.addConfigurationIntoInMemoryCache(configuration, formId, server, namespace);
            }
        }
    }

    private async addConfigurationIntoInMemoryCache(
        configuration: any, 
        formId: string, 
        server: HapiServer,
        namespace: FormNamespace
    ) {
        const hashValue = Crypto.createHash('sha256').update(JSON.stringify(configuration)).digest('hex')
        const cacheKey = `${FORMS_KEY_PREFIX}${namespace}:${formId}`;
        
        try {
            const jsonDataString = await this.cache.get(cacheKey);
            if (jsonDataString === null) {
                // Adding new config into cache with the hash value
                const stringConfig = JSON.stringify({
                    ...configuration,
                    id: configuration.id,
                    hash: hashValue
                });
                //@ts-ignore
                server.app.inMemoryFormKeys.push(cacheKey)
                await this.cache.set(cacheKey, stringConfig, {expiresIn: 0});
            } else {
                // Cache has the data, check if hash changed
                const configObj = JSON.parse(jsonDataString);
                if (configObj && configObj.hash && hashValue !== configObj.hash) {
                    // Hash changed, update the configuration
                    const stringConfig = JSON.stringify({
                        ...configuration,
                        id: configuration.id,
                        hash: hashValue
                    });
                    await this.cache.set(cacheKey, stringConfig, {expiresIn: 0});
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    private async addConfigurationsToRedisCache(
        server: HapiServer, 
        configuration: any, 
        formId: string,
        namespace: FormNamespace
    ) {
        //@ts-ignore
        const redisClient: Redis = server.app.redis
        const hashValue = Crypto.createHash('sha256').update(JSON.stringify(configuration)).digest('hex')
        const cacheKey = `${FORMS_KEY_PREFIX}${namespace}:${formId}`;
        
        if (redisClient) {
            const jsonDataString = await redisClient.get(cacheKey);
            if (jsonDataString === null) {
                // Adding new config into redis cache service with the hash value
                const stringConfig = JSON.stringify({
                    ...configuration,
                    id: configuration.id,
                    hash: hashValue
                });
                await redisClient.set(cacheKey, stringConfig);
            } else {
                // Redis has the data, check if hash changed
                const configObj = JSON.parse(jsonDataString);
                if (configObj && configObj.hash && hashValue !== configObj.hash) {
                    // Hash changed, update the configuration
                    const stringConfig = JSON.stringify({
                        ...configuration,
                        id: configuration.id,
                        hash: hashValue
                    });
                    await redisClient.set(cacheKey, stringConfig);
                }
            }
        }
    }

    /**
     * Retrieves a form model from cache using the specified namespace.
     * @param formId - the form identifier
     * @param request - the request object
     * @param namespace - which namespace to retrieve from (defaults to permanent)
     */
    async getFormAdapterModel(
        formId: string, 
        request: HapiRequest,
        namespace: FormNamespace = FormNamespace.Permanent
    ) {
        const tryGetForm = async (ns: FormNamespace) => {
            //@ts-ignore
            if (request.server.app.redis) {
                return await this.getConfigurationFromRedisCache(request, formId, ns);
            } else {
                return await this.getConfigurationFromInMemoryCache(request, formId, ns);
            }
        };

        try {
            // Try primary namespace
            return await tryGetForm(namespace);
        } catch (error) {
            // In E2E mode, fall back to the other namespace
            // This allows E2E tests to publish to preview and access without form_session_identifier
            const isProduction = config.copilotEnv === "production" || config.copilotEnv === "prod";
            if (!isProduction) {
                const fallbackNamespace = namespace === FormNamespace.Permanent
                    ? FormNamespace.Preview
                    : FormNamespace.Permanent;

                request.logger.info({
                    ...LOGGER_DATA,
                    message: `[E2E-FALLBACK] Form ${formId} not found in ${namespace} namespace, trying ${fallbackNamespace}`
                });

                try {
                    return await tryGetForm(fallbackNamespace);
                } catch (fallbackError) {
                    // Both namespaces failed, log fallback error and throw original error
                    request.logger.error({
                        ...LOGGER_DATA,
                        message: `[E2E-FALLBACK] Form ${formId} also not found in fallback namespace ${fallbackNamespace}`,
                        error: fallbackError
                    });
                    throw error;
                }
            }

            // Production mode - no fallback, throw immediately
            throw error;
        }
    }

    private async getConfigurationFromInMemoryCache(
        request: HapiRequest, 
        formId: string,
        namespace: FormNamespace
    ) {
        const {translationLoaderService} = request.services([]);
        const translations = translationLoaderService.getTranslations();
        const cacheKey = `${FORMS_KEY_PREFIX}${namespace}:${formId}`;
        const jsonDataString = await this.cache.get(cacheKey);
        
        if (jsonDataString !== null) {
            const configObj = JSON.parse(jsonDataString);
            return new AdapterFormModel(configObj.configuration, {
                basePath: configObj.id ? configObj.id : formId,
                hash: configObj.hash,
                previewMode: true,
                translationEn: translations.en,
                translationCy: translations.cy
            })
        }
        request.logger.error({
            ...LOGGER_DATA,
            message: `[FORM-CACHE] Cannot find the form ${formId} in ${namespace} namespace`
        });
        throw Boom.notFound("Cannot find the given form");
    }

    private async getConfigurationFromRedisCache(
        request: HapiRequest, 
        formId: string,
        namespace: FormNamespace
    ) {
        //@ts-ignore
        const redisClient: Redis = request.server.app.redis
        const {translationLoaderService} = request.services([]);
        const translations = translationLoaderService.getTranslations();
        const cacheKey = `${FORMS_KEY_PREFIX}${namespace}:${formId}`;
        const jsonDataString = await redisClient.get(cacheKey);
        
        if (jsonDataString !== null) {
            const configObj = JSON.parse(jsonDataString);
            return new AdapterFormModel(configObj.configuration, {
                basePath: configObj.id ? configObj.id : formId,
                hash: configObj.hash,
                previewMode: true,
                translationEn: translations.en,
                translationCy: translations.cy
            })
        }
        request.logger.error({
            ...LOGGER_DATA,
            message: `[FORM-CACHE] Cannot find the form ${formId} in ${namespace} namespace`
        });
        throw Boom.notFound("Cannot find the given form");
    }

    private getRedisClient() {
        if (redisHost || redisUri) {
            const redisOptions: {
                password?: string;
                tls?: {};
            } = {};

            if (redisPassword) {
                redisOptions.password = redisPassword;
            }

            if (redisTls) {
                redisOptions.tls = {};
            }

            const client = isSingleRedis
                ? new Redis(
                    redisUri ?? {
                        host: redisHost,
                        port: redisPort,
                        password: redisPassword,
                    }
                )
                : new Redis.Cluster(
                    [
                        {
                            host: redisHost,
                            port: redisPort,
                        },
                    ],
                    {
                        dnsLookup: (address, callback) => callback(null, address, 4),
                        redisOptions,
                    }
                );
            return client;
        } else {
            console.log({
                ...LOGGER_DATA,
                message: `[FORM-CACHE] using memory caching`,
            })
        }
    }
}

export const catboxProvider = () => {
    /**
     * If redisHost doesn't exist, CatboxMemory will be used instead.
     * More information at {@link https://hapi.dev/module/catbox/api}
     */
    const provider = {
        constructor: redisHost || redisUri ? CatboxRedis.Engine : CatboxMemory.Engine,
        options: {},
    };

    if (redisHost || redisUri) {
        console.log("Starting redis session management")
        const redisOptions: {
            password?: string;
            tls?: {};
        } = {};

        if (redisPassword) {
            redisOptions.password = redisPassword;
        }

        if (redisTls) {
            redisOptions.tls = {};
        }

        const client = isSingleRedis
            ? new Redis(
                redisUri ?? {
                    host: redisHost,
                    port: redisPort,
                    password: redisPassword,
                }
            )
            : new Redis.Cluster(
                [
                    {
                        host: redisHost,
                        port: redisPort,
                    },
                ],
                {
                    dnsLookup: (address, callback) => callback(null, address, 4),
                    redisOptions,
                }
            );
        provider.options = {client, partition};
        console.log(`Redis Url : ${redisUri} session management`);
    } else {
        console.log("Starting in memory session management")
        provider.options = {partition};
    }

    return provider;
};