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
import { PreAwardApiService, PublishedFormResponse } from "./PreAwardApiService";

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
    private logger: any;
    private apiService: PreAwardApiService;
    private formStorage: Redis | any;

    constructor(server: HapiServer) {
        //@ts-ignore
        super(server);
        this.logger = server.logger;
        this.apiService = server.services([]).preAwardApiService;
        const redisClient = this.getRedisClient();
        if (redisClient) {
            this.formStorage = redisClient;
        } else {
            // Starting up the in memory cache
            this.cache.client.start();
            this.formStorage = this.cache;
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
        return {
            segment: partition,
            id: `${id}${additionalIdentifier ?? ""}`,
        };
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

    /**
     * Validates cached form against Pre-Award API.
     */
    private async validateCachedForm(formId: string, cachedHash: string, request: HapiRequest): Promise<boolean> {
        try {
            const currentHash = await this.apiService.getFormHash(formId, request);
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
    private async fetchAndCacheForm(formId: string, request: HapiRequest): Promise<PublishedFormResponse | null> {
        try {
            const apiResponse = await this.apiService.getPublishedForm(formId, request);
            if (!apiResponse) return null;
            const formsCacheKey = `${FORMS_KEY_PREFIX}:${formId}`;
            await this.formStorage.set(formsCacheKey, JSON.stringify(apiResponse));
            this.logger.info({
                ...LOGGER_DATA,
                message: `Cached form ${formId} from Pre-Award API`
            });
            return apiResponse as PublishedFormResponse;
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
     * Retrieves form configuration, either from cache or Pre-Award API.
     */
    async getFormAdapterModel(formId: string, request: HapiRequest): Promise<AdapterFormModel> {
        const {translationLoaderService} = request.services([]);
        const translations = translationLoaderService.getTranslations();
        const formCacheKey = `${FORMS_KEY_PREFIX}:${formId}`;
        const formSessionIdentifier = request.query.form_session_identifier;
        const formSessionCacheKey = formSessionIdentifier ? `${formCacheKey}:${formSessionIdentifier}` : null;
        const jsonDataString = await this.formStorage.get(formCacheKey);
        let configObj = null;
        if (jsonDataString !== null) {
            // Cache hit
            configObj = JSON.parse(jsonDataString);
            const sessionValidated = formSessionCacheKey ? await this.formStorage.get(formSessionCacheKey) : false;
            if (!sessionValidated) {
                // Validate cached form on first access in session
                this.logger.debug({
                    ...LOGGER_DATA,
                    message: `First access of form ${formId} in session ${request.yar.id}, validating cache`
                });
                const isValid = await this.validateCachedForm(formId, configObj.hash, request);
                if (!isValid) {
                    this.logger.debug({
                        ...LOGGER_DATA,
                        message: `Cache stale for form ${formId}, fetching fresh version`
                    });
                    const freshConfig = await this.fetchAndCacheForm(formId, request);
                    if (freshConfig) {
                        configObj = freshConfig;
                    }
                } else {
                    this.logger.debug({
                        ...LOGGER_DATA,
                        message: `Cache valid for form ${formId}`
                    });
                }
            }
        } else {
            // Cache miss - fetch from Pre-Award API
            this.logger.info({
                ...LOGGER_DATA,
                message: `Cache miss for form ${formId}, fetching from Pre-Award API`
            });
            configObj = await this.fetchAndCacheForm(formId, request);
            if (!configObj) {
                throw Boom.notFound(`Form '${formId}' not found`);
            }
        }
        if (formSessionCacheKey) {
            // Mark form as validated in this session
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
