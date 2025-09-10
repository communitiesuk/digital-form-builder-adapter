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

// Storage adapter interface
interface StorageAdapter {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, options?: any): Promise<void>;
    getKeys(pattern: string): Promise<string[]>;
}

// Redis storage adapter implementation
class RedisStorageAdapter implements StorageAdapter {
    constructor(private redis: Redis) {}
    
    async get(key: string): Promise<string | null> {
        return this.redis.get(key);
    }
    
    async set(key: string, value: string): Promise<void> {
        await this.redis.set(key, value);
    }
    
    async getKeys(pattern: string): Promise<string[]> {
        return this.redis.keys(pattern);
    }
}

// In-memory storage adapter implementation
class InMemoryStorageAdapter implements StorageAdapter {
    private formKeys: Set<string> = new Set();
    
    constructor(private cache: any) {}
    
    async get(key: string): Promise<string | null> {
        return this.cache.get(key);
    }
    
    async set(key: string, value: string, options?: any): Promise<void> {
        // Track form keys for listing purposes
        if (key.startsWith(FORMS_KEY_PREFIX)) {
            this.formKeys.add(key);
        }
        
        // Default to no expiration for form configs
        const cacheOptions = options || {expiresIn: 0};
        await this.cache.set(key, value, cacheOptions);
    }
    
    async getKeys(pattern: string): Promise<string[]> {
        // For in-memory, return tracked form keys that match the pattern
        if (pattern === `${FORMS_KEY_PREFIX}*`) {
            return Array.from(this.formKeys);
        }
        return [];
    }
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
    private storageAdapter: StorageAdapter;

    constructor(server: HapiServer) {
        //@ts-ignore
        super(server);
        const redisClient = this.getRedisClient();
        if (redisClient) {
            //@ts-ignore
            server.app.redis = redisClient;
            this.storageAdapter = new RedisStorageAdapter(redisClient);
        } else {
            // Starting up the in memory cache
            this.cache.client.start();
            //@ts-ignore
            server.app.inMemoryFormKeys = [];
            this.storageAdapter = new InMemoryStorageAdapter(this.cache);
        }
    }

    async activateSession(jwt, request): Promise<{ redirectPath: string }> {
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
    Key(request: HapiRequest, additionalIdentifier?: ADDITIONAL_IDENTIFIER): { segment: string; id: string } {
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
     * handling form configuration's in a redis cache to easily distribute them among instance
     * * If given fom id is not available, it will generate a hash based on the configuration, And it will be saved in redis cache
     * * If hash is change then updating the redis
     * @param formId form id
     * @param configuration form definition configurations
     * @param server server object
     */
    async setFormConfiguration(formId: string, configuration: any): Promise<void> {
        if (!formId || !configuration) return;
        const hashValue = Crypto.createHash('sha256')
            .update(JSON.stringify(configuration))
            .digest('hex');
        const key = `${FORMS_KEY_PREFIX}${formId}`;
        try {
            const existingConfigString = await this.storageAdapter.get(key);
            
            if (existingConfigString === null) {
                // Adding new config with the hash value
                const stringConfig = JSON.stringify({
                    ...configuration,
                    id: configuration.id,
                    hash: hashValue
                });
                await this.storageAdapter.set(key, stringConfig);
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
                    await this.storageAdapter.set(key, stringConfig);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    async getFormAdapterModel(formId: string, request: HapiRequest): Promise<AdapterFormModel> {
        const {translationLoaderService} = request.services([]);
        const translations = translationLoaderService.getTranslations();
        const jsonDataString = await this.storageAdapter.get(`${FORMS_KEY_PREFIX}${formId}`);
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
        request.logger.error({
            ...LOGGER_DATA,
            message: `[FORM-CACHE] Cannot find the form ${formId}`
        });
        throw Boom.notFound("Cannot find the given form");
    }

    async getFormConfigurations(): Promise<FormConfiguration[]> {
        const keys = await this.storageAdapter.getKeys(`${FORMS_KEY_PREFIX}*`);
        const configs: FormConfiguration[] = [];
        for (const key of keys) {
            const configString = await this.storageAdapter.get(key);
            if (configString) {
                const configObj = JSON.parse(configString);
                const result = AdapterSchema.validate(configObj.configuration, {abortEarly: false});
                configs.push(
                    new FormConfiguration(
                        key.replace(FORMS_KEY_PREFIX, ""),
                        result.value.name,
                        undefined,
                        result.value.feedback?.feedbackForm
                    )
                );
            }
        }
        return configs;
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
