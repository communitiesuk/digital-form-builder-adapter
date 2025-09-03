import {CacheService} from "../../../../digital-form-builder/runner/src/server/services";
import Jwt from "@hapi/jwt";
import {DecodedSessionToken} from "../../../../digital-form-builder/runner/src/server/plugins/initialiseSession/types";
import {config} from "../plugins/utils/AdapterConfigurationSchema";
import CatboxRedis from "@hapi/catbox-redis";
import Redis from "ioredis";
import Crypto from 'crypto';
import {HapiRequest, HapiServer} from "../types";
import {AdapterFormModel} from "../plugins/engine/models";
import Boom from "boom";
import {FormConfiguration} from "@xgovformbuilder/model";
import {PreAwardApiService} from "./PreAwardApiService";

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
const FORMS_SESSION_PREFIX = "forms:session:"

enum ADDITIONAL_IDENTIFIER {
    Confirmation = ":confirmation",
}

export class AdapterCacheService extends CacheService {
    private redisClient: Redis;

    constructor(server: HapiServer) {
        //@ts-ignore
        super(server);
        
        this.redisClient = this.getRedisClient();
        if (!this.redisClient) {
            throw new Error("Redis is required for Form Runner. Please configure Redis connection.");
        }
        
        //@ts-ignore
        server.app.redis = this.redisClient;
    }

    async activateSession(jwt, request) {
        const initialisedSession = await this.cache.get(this.JWTKey(jwt));
        const {decoded} = Jwt.token.decode(jwt);
        const {payload}: { payload: DecodedSessionToken } = decoded;
        const userSessionKey = {segment: partition, id: `${request.yar.id}:${payload.group}`};
        const {redirectPath} = await super.activateSession(jwt, request);

        let redirectPathNew = redirectPath;
        const form_session_identifier = initialisedSession.metadata?.form_session_identifier;
        if (form_session_identifier) {
            userSessionKey.id = `${userSessionKey.id}:${form_session_identifier}`;
            redirectPathNew = `${redirectPathNew}?form_session_identifier=${form_session_identifier}`;
        }

        const mergedSession = config.overwriteInitialisedSession 
            ? initialisedSession 
            : {...(await this.cache.get(userSessionKey)), ...initialisedSession};
            
        this.cache.set(userSessionKey, mergedSession, sessionTimeout);
        await this.cache.drop(this.JWTKey(jwt));
        
        return {redirectPath: redirectPathNew};
    }

    //@ts-ignore
    Key(request: HapiRequest, additionalIdentifier?: ADDITIONAL_IDENTIFIER) {
        let id = `${request.yar.id}:${request.params.id}`;
        if (request.query.form_session_identifier) {
            id = `${id}:${request.query.form_session_identifier}`;
        }
        return {
            segment: partition,
            id: `${id}${additionalIdentifier ?? ""}`,
        };
    }

    /**
     * Main entry point for retrieving a form model.
     * Implements session-based cache validation strategy.
     */
    async getFormAdapterModel(formId: string, request: HapiRequest) {
        const {translationLoaderService} = request.services([]);
        const translations = translationLoaderService.getTranslations();
        const cacheKey = `${FORMS_KEY_PREFIX}${formId}`;
        const sessionCacheKey = `${FORMS_SESSION_PREFIX}${request.yar.id}:${formId}`;
        
        // Check if we've already validated this form in this user's session
        const sessionValidated = await this.redisClient.get(sessionCacheKey);
        
        // Try to get from cache first
        let jsonDataString = await this.redisClient.get(cacheKey);
        let configObj = null;
        
        if (jsonDataString !== null) {
            configObj = JSON.parse(jsonDataString);
            
            // Only validate if we haven't already validated in this session
            if (!sessionValidated) {
                request.logger.info({
                    ...LOGGER_DATA,
                    message: `First access of form ${formId} in session ${request.yar.id}, validating cache`
                });
                
                const isValid = await this.validateCachedForm(formId, configObj.hash, request);
                
                if (!isValid) {
                    request.logger.info({
                        ...LOGGER_DATA,
                        message: `Cache stale for form ${formId}, fetching fresh version`
                    });
                    
                    const freshConfig = await this.fetchAndCacheForm(formId, request);
                    if (freshConfig) {
                        configObj = freshConfig;
                    }
                } else {
                    request.logger.info({
                        ...LOGGER_DATA,
                        message: `Cache validated successfully for form ${formId}`
                    });
                }
                
                // Mark as validated for this session (expires with session timeout)
                await this.redisClient.setex(sessionCacheKey, sessionTimeout / 1000, "validated");
            }
        } else {
            // Cache miss - fetch from Pre-Award API
            request.logger.info({
                ...LOGGER_DATA,
                message: `Cache miss for form ${formId}, fetching from Pre-Award API`
            });
            
            configObj = await this.fetchAndCacheForm(formId, request);
            
            if (!configObj) {
                throw Boom.notFound(`Form '${formId}' not found`);
            }
            
            // Mark as validated for this session
            await this.redisClient.setex(sessionCacheKey, sessionTimeout / 1000, "validated");
        }
        
        return new AdapterFormModel(configObj.configuration, {
            basePath: configObj.id || formId,
            hash: configObj.hash,
            previewMode: config.previewMode,
            translationEn: translations.en,
            translationCy: translations.cy
        });
    }

    /**
     * Validates cached form against Pre-Award API.
     */
    private async validateCachedForm(formId: string, cachedHash: string, request: HapiRequest): Promise<boolean> {
        try {
            const {preAwardApiService} = request.services([]);
            const currentHash = await preAwardApiService.getFormHash(formId, request);
            return currentHash === cachedHash;
        } catch (error) {
            // If we can't validate, assume cache is valid
            request.logger.warn({
                ...LOGGER_DATA,
                message: `Could not validate cache for form ${formId}, using cached version`
            });
            return true;
        }
    }

    /**
     * Fetches form from Pre-Award API and caches it.
     */
    private async fetchAndCacheForm(formId: string, request: HapiRequest): Promise<any> {
        try {
            const {preAwardApiService} = request.services([]);
            const formData = await preAwardApiService.getPublishedForm(formId, request);
            
            if (!formData) {
                return null;
            }
            
            // Recursively sort keys to match Python's sort_keys=True
            const sortKeys = (obj: any): any => {
                if (!obj || typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) return obj.map(sortKeys);
                return Object.keys(obj).sort().reduce((acc, key) => {
                    acc[key] = sortKeys(obj[key]);
                    return acc;
                }, {} as any);
            };
            
            // Create JSON with sorted keys and no spaces (matching Python's separators)
            const jsonString = JSON.stringify(sortKeys(formData));
            const hashValue = Crypto.createHash('md5')
                .update(jsonString)
                .digest('hex');
            
            const configToCache = {
                configuration: formData,
                id: formId,
                hash: hashValue,
                fetchedAt: new Date().toISOString()
            };
            
            // Rest of the function stays the same...
            const ttl = 3600;
            const cacheKey = `${FORMS_KEY_PREFIX}${formId}`;
            await this.redisClient.setex(
                cacheKey,
                ttl,
                JSON.stringify(configToCache)
            );
            
            request.logger.info({
                ...LOGGER_DATA,
                message: `Cached form ${formId} from Pre-Award API`
            });
            
            return configToCache;
            
        } catch (error) {
            request.logger.error({
                ...LOGGER_DATA,
                message: `Failed to fetch form ${formId}`,
                error: error
            });
            return null;
        }
    }

    /**
     * Gets list of available forms from Pre-Award API.
     */
    async getFormConfigurations(request: HapiRequest): Promise<FormConfiguration[]> {
        try {
            const {preAwardApiService} = request.services([]);
            const forms = await preAwardApiService.getAllForms(request);
            
            return forms
                .filter(f => f.is_published)
                .map(f => new FormConfiguration(f.name, f.name, undefined, false));
        } catch (error) {
            request.logger.error({
                ...LOGGER_DATA,
                message: 'Failed to fetch forms list'
            });
            return [];
        }
    }

    async getConfirmationState(request: HapiRequest) {
        const key = this.Key(request, ADDITIONAL_IDENTIFIER.Confirmation);
        return this.cache.get(key);
    }

    async setConfirmationState(request: HapiRequest, confirmation: any) {
        const key = this.Key(request, ADDITIONAL_IDENTIFIER.Confirmation);
        await this.cache.set(key, confirmation, sessionTimeout);
    }

    private getRedisClient(): Redis {
        if (!redisHost && !redisUri) {
            throw new Error("Redis configuration required. Set REDIS_HOST or FORM_RUNNER_ADAPTER_REDIS_INSTANCE_URI");
        }

        const redisOptions: {password?: string; tls?: {}} = {};
        if (redisPassword) redisOptions.password = redisPassword;
        if (redisTls) redisOptions.tls = {};

        return isSingleRedis
            ? new Redis(redisUri ?? {host: redisHost, port: redisPort, ...redisOptions})
            : new Redis.Cluster(
                [{host: redisHost, port: redisPort}],
                {dnsLookup: (address, callback) => callback(null, address, 4), redisOptions}
            );
    }
}

export const catboxProvider = () => {
    if (!redisHost && !redisUri) {
        throw new Error("Redis is required for Form Runner");
    }

    const redisOptions: {password?: string; tls?: {}} = {};
    if (redisPassword) redisOptions.password = redisPassword;
    if (redisTls) redisOptions.tls = {};

    const client = isSingleRedis
        ? new Redis(redisUri ?? {host: redisHost, port: redisPort, ...redisOptions})
        : new Redis.Cluster(
            [{host: redisHost, port: redisPort}],
            {dnsLookup: (address, callback) => callback(null, address, 4), redisOptions}
        );

    return {
        constructor: CatboxRedis.Engine,
        options: {client, partition}
    };
};
