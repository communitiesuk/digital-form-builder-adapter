import { HapiServer } from "../types";
import { config } from "../plugins/utils/AdapterConfigurationSchema";
import Boom from "boom";
import wreck from "@hapi/wreck";

export interface FormHashResponse {
    hash: string;
}

export interface PublishedFormResponse {
    configuration: any;
    hash: string;
}

const LOGGER_DATA = {
    class: "PreAwardApiService",
}

export class PreAwardApiService {
    private logger: any;
    private apiBaseUrl: string;
    private wreck: typeof wreck;
    
    constructor(server: HapiServer) {
        this.logger = server.logger;
        this.apiBaseUrl = config.formStoreApiHost;
        this.wreck = wreck.defaults({
            timeout: 10000,
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json'
            }
        });
        this.logger.info({
            ...LOGGER_DATA,
            message: `Service initialized with base URL: ${this.apiBaseUrl}`
        });
    }
    
    /**
     * Fetches the published form data including hash for a specific form.
     * This is the primary method used by the cache service when a form
     * is requested by a user. It only returns forms that have been
     * explicitly published in the Pre-Award system.
     */
    async getPublishedForm(name: string): Promise<PublishedFormResponse | null> {
        const url = `${this.apiBaseUrl}/${name}/published`;
        this.logger.info({
            ...LOGGER_DATA,
            message: `Fetching published form: ${name}`,
            url: url
        });
        try {
            const { payload } = await this.wreck.get(url, {json: true});
            this.logger.info({
                ...LOGGER_DATA,
                message: `Successfully fetched published form: ${name}`
            });
            return payload as PublishedFormResponse;
        } catch (error: any) {
            // Handle 404 - form doesn't exist or isn't published
            if (error.output?.statusCode === 404) {
                this.logger.info({
                    ...LOGGER_DATA,
                    message: `Form ${name} not found or not published in Pre-Award API`
                });
                return null;
            }
            // Handle other errors (network, timeout, server errors)
            this.logger.error({
                ...LOGGER_DATA,
                message: `Failed to fetch published form ${name}`,
                error: error.message
            });
            // Don't expose internal error details to the client
            throw Boom.serverUnavailable('Pre-Award API is temporarily unavailable');
        }
    }
    
    /**
     * Fetches just the hash of a published form.
     * This lightweight endpoint allows us to validate our cache without
     * downloading the entire form definition. We use this for periodic
     * cache freshness checks.
     */
    async getFormHash(name: string): Promise<string | null> {
        const url = `${this.apiBaseUrl}/${name}/hash`;
        try {
            const { payload } = await this.wreck.get(url, {json: true});
            const data = payload as FormHashResponse;
            this.logger.debug({
                ...LOGGER_DATA,
                message: `Retrieved hash for form ${name}`
            });
            return data.hash;
        } catch (error: any) {
            if (error.output?.statusCode === 404) {
                // Form doesn't exist or isn't published - this is normal
                return null;
            }
            // For hash validation failures, we don't want to fail the entire request.
            // We'll continue using the cached version and try again later.
            this.logger.warn({
                ...LOGGER_DATA,
                message: `Could not fetch hash for form ${name}, will use cached version`,
                error: error.message
            });
            return null;
        }
    }
}