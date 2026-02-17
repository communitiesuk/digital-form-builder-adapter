import { HapiServer } from "../types";
import { config } from "../plugins/utils/AdapterConfigurationSchema";
import Boom from "boom";
import wreck from "@hapi/wreck";

export interface FormHashResponse {
    hash: string;
}

export interface PublishedFormResponse {
    created_at: string;
    display_name: string;
    hash: string;
    id: string;
    is_published: boolean;
    published_at: string;
    published_json: any;
    updated_at: string;
    url_path: string;
}

export interface DraftFormResponse {
    created_at: string;
    display_name: string;
    hash: string;
    id: string;
    is_published: boolean;
    draft_json: any;
    updated_at: string;
    url_path: string;
}

enum FormType {
    PUBLISHED = 'published',
    DRAFT = 'draft'
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
        return this.fetchForm<PublishedFormResponse>(name, FormType.PUBLISHED);
    }
        
    /**
     * Fetches the draft form data including hash for a specific form.
     * This returns the current draft version of a form, which may differ
     * from the published version.
     */
    async getDraftForm(name: string): Promise<DraftFormResponse | null> {
        return this.fetchForm<DraftFormResponse>(name, FormType.DRAFT);
    }
    
    /**
     * Generic form fetching method that handles both published and draft endpoints.
     */
    private async fetchForm<T>(name: string, type: FormType): Promise<T | null> {
        const url = `${this.apiBaseUrl}/${name}/${type}`;
        this.logger.info({
            ...LOGGER_DATA,
            message: `Fetching ${type} form: ${name}`,
            url: url
        });
        try {
            const { payload } = await this.wreck.get(url, {json: true});
            this.logger.info({
                ...LOGGER_DATA,
                message: `Successfully fetched ${type} form: ${name}`
            });
            return payload as T;
        } catch (error: any) {
            // Handle 404 - form doesn't exist or isn't published/drafted
            if (error.output?.statusCode === 404) {
                this.logger.info({
                    ...LOGGER_DATA,
                    message: `Form ${name} not found or not ${type} in Pre-Award API`
                });
                return null;
            }
            // Handle other errors (network, timeout, server errors)
            this.logger.error({
                ...LOGGER_DATA,
                message: `Failed to fetch ${type} form ${name}`,
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
    async getPublishedFormHash(name: string): Promise<string | null> {
        return this.fetchFormHash<FormHashResponse>(name, FormType.PUBLISHED);
    }
    
    /**
     * Fetches just the hash of a draft form.
     * This lightweight endpoint allows us to validate our cache without
     * downloading the entire form definition. We use this for periodic
     * cache freshness checks.
     */
    async getDraftFormHash(name: string): Promise<string | null> {
        return this.fetchFormHash<FormHashResponse>(name, FormType.DRAFT);
    }
    
    /**
     * Generic hash fetching method that handles both published and draft endpoints.
     */
    private async fetchFormHash<T extends FormHashResponse>(name: string, type: FormType): Promise<string | null> {
        const url = `${this.apiBaseUrl}/${name}/${type}/hash`;
        try {
            const { payload } = await this.wreck.get(url, {json: true});
            const data = payload as T;
            this.logger.debug({
                ...LOGGER_DATA,
                message: `Retrieved ${type} hash for form ${name}`
            });
            return data.hash;
        } catch (error: any) {
            if (error.output?.statusCode === 404) {
                // Form doesn't exist or isn't published/drafted - this is normal
                return null;
            }
            // For hash validation failures, we don't want to fail the entire request.
            // We'll continue using the cached version and try again later.
            this.logger.warn({
                ...LOGGER_DATA,
                message: `Could not fetch ${type} hash for form ${name}, will use cached version`,
                error: error.message
            });
            return null;
        }
    }
}
