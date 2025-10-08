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
import { PreAwardApiService } from "./PreAwardApiService";

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

export const FORMS_KEY_PREFIX = "forms"

enum ADDITIONAL_IDENTIFIER {
    Confirmation = ":confirmation",
}

const createRedisClient = (): Redis | null => {
   if (redisHost || redisUri) {
       const redisOptions: {password?: string; tls?: {};} = {};
       if (redisPassword) redisOptions.password = redisPassword;
       if (redisTls) redisOptions.tls = {};
       
       return isSingleRedis
           ? new Redis(redisUri ?? {host: redisHost, port: redisPort, password: redisPassword})
           : new Redis.Cluster(
               [{host: redisHost, port: redisPort}],
               {dnsLookup: (address, callback) => callback(null, address, 4), redisOptions}
           );
   }
   return null;
};

export class AdapterCacheService extends CacheService {
    private apiService: PreAwardApiService;
    private formStorage: Redis | any;
    private logger: any;

    constructor(server: HapiServer) {
        //@ts-ignore
        super(server);
        this.apiService = server.services([]).preAwardApiService;
        this.logger = server.logger;
        const redisClient = this.getRedisClient();
        if (redisClient) {
            this.formStorage = redisClient;
        } else {
            // Starting up the in memory cache
            this.cache.client.start();
            this.formStorage = {
                get: (key) => this.cache.get(key),
                set: (key, value) => this.cache.set(key, value, {expiresIn: 0}),
                setex: (key, ttl, value) => this.cache.set(key, value, {expiresIn: ttl}),
            }
        }
    }

    async activateSession(jwt, request): Promise<{ redirectPath: string }> {
        this.logger.info(`[ACTIVATE-SESSION] jwt ${jwt}`);
        const initialisedSession = await this.cache.get(this.JWTKey(jwt));
        this.logger.info(`[ACTIVATE-SESSION] session details ${initialisedSession}`);
        const {decoded} = Jwt.token.decode(jwt);
        const {payload}: { payload: DecodedSessionToken } = decoded;
        const userSessionKey = {segment: partition, id: `${request.yar.id}:${payload.group}`};
        this.logger.info(`[ACTIVATE-SESSION] session metadata ${userSessionKey}`);
        const {redirectPath} = await super.activateSession(jwt, request);
        let redirectPathNew = redirectPath
        const form_session_identifier = initialisedSession.metadata?.form_session_identifier;
        if (form_session_identifier) {
            userSessionKey.id = `${userSessionKey.id}:${form_session_identifier}`;
            redirectPathNew = `${redirectPathNew}?form_session_identifier=${form_session_identifier}`;
        }
        if (config.overwriteInitialisedSession) {
            this.logger.info("[ACTIVATE-SESSION] Replacing user session with initialisedSession");
            this.cache.set(userSessionKey, initialisedSession, sessionTimeout);
        } else {
            const currentSession = await this.cache.get(userSessionKey);
            const mergedSession = {
                ...currentSession,
                ...initialisedSession,
            };
            this.logger.info("[ACTIVATE-SESSION] Merging user session with initialisedSession");
            this.cache.set(userSessionKey, mergedSession, sessionTimeout);
        }
        this.logger.info(`[ACTIVATE-SESSION] redirect ${redirectPathNew}`);
        const key = this.JWTKey(jwt);
        this.logger.info(`[ACTIVATE-SESSION] drop key ${JSON.stringify(key)}`);
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
    Key(request: HapiRequest, additionalIdentifier?: ADDITIONAL_IDENTIFIER): { segment: string; id: string } {
        let id = `${request.yar.id}:${request.params.id}`;

        if (request.query.form_session_identifier) {
            id = `${id}:${request.query.form_session_identifier}`;
        }
        this.logger.info(`[ACTIVATE-SESSION] session key ${id} and segment is ${partition}`);
        return {
            segment: partition,
            id: `${id}${additionalIdentifier ?? ""}`,
        };
    }

    /**
     * Validates cached form against Pre-Award API.
     */
    private async validateCachedForm(formId: string, cachedHash: string): Promise<boolean> {
        try {
            const currentHash = await this.apiService.getFormHash(formId);
            return currentHash === cachedHash;
        } catch (error) {
            // If we can't validate, assume cache is valid
            this.logger.warn({
                ...LOGGER_DATA,
                message: `Could not validate cache for form ${formId}, using cached version`
            });
            return true;
        }
    }

    /**
     * Fetches form from Pre-Award API and caches it.
     */
    private async fetchAndCacheForm(formId: string): Promise<{ configuration: any; hash: string } | null> {
        try {
            const apiResponse = await this.apiService.getPublishedForm(formId);
            if (!apiResponse) return null;
            const configToCache = {
                configuration: apiResponse.published_json,
                hash: apiResponse.hash,
            }
            const formsCacheKey = `${FORMS_KEY_PREFIX}:${formId}`;
            await this.formStorage.set(formsCacheKey, JSON.stringify(configToCache));
            this.logger.info({
                ...LOGGER_DATA,
                message: `Cached form ${formId} from Pre-Award API`
            });
            return configToCache;
        } catch (error) {
            this.logger.error({
                ...LOGGER_DATA,
                message: `Failed to fetch form ${formId}`,
                error: error
            });
            return null;
        }
    }

    /**
     * This is used to ensure unit tests can populate the cache
     */
    async setFormConfiguration(formId: string, configuration: any): Promise<void> {
        if (!formId || !configuration) return;
        const hashValue = Crypto.createHash('sha256')
            .update(JSON.stringify(configuration))
            .digest('hex');
        const key = `${FORMS_KEY_PREFIX}:${formId}`;
        try {
            const existingConfigString = await this.formStorage.get(key);
            if (existingConfigString === null) {
                // Adding new config with the hash value
                const stringConfig = JSON.stringify({
                    ...configuration,
                    id: configuration.id,
                    hash: hashValue
                });
                await this.formStorage.set(key, stringConfig);
            } else {
                // Check if hash has changed
                const existingConfig = JSON.parse(existingConfigString);
                if (existingConfig?.hash !== hashValue) {
                    // Hash has changed, update the configuration
                    const stringConfig = JSON.stringify({
                        ...configuration,
                        id: configuration.id,
                        hash: hashValue
                    });
                    await this.formStorage.set(key, stringConfig);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Retrieves form configuration, either from cache or Pre-Award API.
     */
    async getFormAdapterModel(formId: string, request: HapiRequest): Promise<AdapterFormModel> {
        const {translationLoaderService} = request.services([]);
        const translations = translationLoaderService.getTranslations();
        const formCacheKey = `${FORMS_KEY_PREFIX}:${formId}`;
        const jsonDataString = await this.formStorage.get(formCacheKey);
        // We use a separate key to track if we've validated that this form is up-to-date in this session
        // We use yar.id instead of form_session_identifier as form_session_identifier is not present in the first request
        const formSessionCacheKey = `${formCacheKey}:${request.yar.id}`;
        const sessionValidated = await this.formStorage.get(formSessionCacheKey);
        let configObj = null;
        if (jsonDataString !== null) {
            // Cache hit
            this.logger.debug({
                ...LOGGER_DATA,
                message: `Cache hit for form ${formId}`
            });
            configObj = JSON.parse(jsonDataString);
            if (!sessionValidated) {
                // Validate cached form once per session
                this.logger.debug({
                    ...LOGGER_DATA,
                    message: `First access of form ${formId} in yar session ${request.yar.id}, validating cache`
                });
                const isValid = await this.validateCachedForm(formId, configObj.hash);
                if (!isValid) {
                    this.logger.info({
                        ...LOGGER_DATA,
                        message: `Cache stale for form ${formId}, fetching fresh version`
                    });
                    const freshConfig = await this.fetchAndCacheForm(formId);
                    if (freshConfig) {
                        configObj = freshConfig;
                    }
                } else {
                    this.logger.debug({
                        ...LOGGER_DATA,
                        message: `Cache valid for form ${formId}`
                    });
                }
            } else {
                this.logger.debug({
                    ...LOGGER_DATA,
                    message: `Form ${formId} already validated in yar session ${request.yar.id}`
                });
            }
        } else {
            // Cache miss - fetch from Pre-Award API
            this.logger.info({
                ...LOGGER_DATA,
                message: `Cache miss for form ${formId}, fetching from Pre-Award API`
            });
            configObj = await this.fetchAndCacheForm(formId);
            if (!configObj) {
                throw Boom.notFound(`Form '${formId}' not found`);
            }
        }
        if (!sessionValidated) {
            // Mark form as validated in this session
            this.logger.debug({
                ...LOGGER_DATA,
                message: `Marking form ${formId} as validated in yar session ${request.yar.id}`
            });
            await this.formStorage.setex(formSessionCacheKey, sessionTimeout / 1000, true);
        }
        return new AdapterFormModel(configObj.configuration, {
            basePath: formId,
            hash: configObj.hash,
            previewMode: true,
            translationEn: translations.en,
            translationCy: translations.cy
        });
    }

    private getRedisClient(): Redis | null {
       const client = createRedisClient();
       if (!client) {
           console.log({
               ...LOGGER_DATA,
               message: `[FORM-CACHE] using memory caching`,
           });
       }
       return client;
   }
}

export const catboxProvider = () => {
    /**
     * If redisHost doesn't exist, CatboxMemory will be used instead.
     * More information at {@link https://hapi.dev/module/catbox/api}
     */
    const provider = {
        constructor: redisHost || redisUri ? CatboxRedis.Engine : CatboxMemory.Engine,
        options: {partition},
    };

    if (redisHost || redisUri) {
       console.log("Starting redis session management");
       const client = createRedisClient();
       provider.options = {client, partition};
       console.log(`Redis Url : ${redisUri} session management`);
    } else {
        console.log("Starting in memory session management");
    }

    return provider;
};
