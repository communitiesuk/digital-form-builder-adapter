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

const partition = "cache";
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
    private formStorage: Redis | any;
    private logger: any;

    constructor(server: HapiServer) {
        //@ts-ignore
        super(server);
        this.logger = server.logger;
        const redisClient = createRedisClient();
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
        namespace: FormNamespace = FormNamespace.Permanent
    ): Promise<void> {
        if (!formId || !configuration) return;
        const hashValue = Crypto.createHash('sha256')
            .update(JSON.stringify(configuration))
            .digest('hex');
        const key = `${FORMS_KEY_PREFIX}:${namespace}:${formId}`;
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
     * Retrieves a form model from cache using the specified namespace.
     * @param formId - the form identifier
     * @param request - the request object
     * @param namespace - which namespace to retrieve from (defaults to permanent)
     */
    async getFormAdapterModel(
        formId: string, 
        request: HapiRequest,
        namespace: FormNamespace = FormNamespace.Permanent
    ) : Promise<AdapterFormModel> {
        const {translationLoaderService} = request.services([]);
        const translations = translationLoaderService.getTranslations();
        const jsonDataString = await this.formStorage.get(`${FORMS_KEY_PREFIX}:${formId}`);
        if (jsonDataString !== null) {
            const configObj = JSON.parse(jsonDataString);
            return new AdapterFormModel(configObj.configuration, {
                basePath: configObj.id ? configObj.id : formId,
                hash: configObj.hash,
                previewMode: true,
                translationEn: translations.en,
                translationCy: translations.cy
            });
        }
        this.logger.error(`[FORM-CACHE] Cannot find the form ${formId} in ${namespace} namespace`);
        throw Boom.notFound("Cannot find the given form");
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