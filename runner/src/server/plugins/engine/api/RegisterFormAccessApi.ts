import {RegisterApi} from "./RegisterApi";
import {HapiRequest, HapiResponseToolkit, HapiServer} from "../../../types";
import Boom from "boom";
import {PluginUtil} from "../util/PluginUtil";
import {getValidStateFromQueryParameters} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/helpers";
import {PluginSpecificConfiguration} from "@hapi/hapi";
import {jwtAuthStrategyName} from "../Auth";
import {config} from "../../utils/AdapterConfigurationSchema";

/**
 * Registers all routes for accessing and interacting with forms.
 * This includes the main form pages, form submission handlers, and file uploads.
 * Forms are fetched on-demand from the Pre-Award API via the cache service.
 */
export class RegisterFormAccessApi implements RegisterApi {

    register(server: HapiServer): void {
        const {s3UploadService} = server.services([]);
        
        // Pre-handler to populate form data from query parameters
        const queryParamPreHandler = async (
            request: HapiRequest,
            h: HapiResponseToolkit
        ) => {
            const {query} = request;
            const {id} = request.params;
            const {adapterCacheService} = request.services([]);
            
            const model = await adapterCacheService.getFormAdapterModel(id, request);
            if (!model) {
                throw Boom.notFound(`Form '${id}' not found`);
            }

            const prePopFields = model.fieldsForPrePopulation;
            if (Object.keys(query).length === 0 || Object.keys(prePopFields).length === 0) {
                return h.continue;
            }
            
            //@ts-ignore
            const state = await adapterCacheService.getState(request);
            const newValues = getValidStateFromQueryParameters(prePopFields, query, state);
            
            if (Object.keys(newValues).length > 0) {
                //@ts-ignore
                await adapterCacheService.mergeState(request, newValues);
                h.request.pre.hasPrepopulatedSessionFromQueryParameter = true;
            }
            
            return h.continue;
        };

        // Pre-handler to check session validity
        const checkUserSession = async (
            request: HapiRequest,
            h: HapiResponseToolkit
        ) => {
            const {adapterCacheService} = request.services([]);
            //@ts-ignore
            const state = await adapterCacheService.getState(request);

            // In production, ensure valid session exists
            if (!config.previewMode && !state.callback) {
                request.logger.error(
                    ["checkUserSession"],
                    `Session expired or invalid for user ${request.yar.id}`
                );
                throw Boom.clientTimeout("Session expired");
            }

            return h.continue;
        };

        // Pre-handler for file uploads
        const handleFiles = async (request: HapiRequest, h: HapiResponseToolkit) => {
            const {path, id} = request.params;
            const {adapterCacheService} = request.services([]);
            const model = await adapterCacheService.getFormAdapterModel(id, request);
            const page = model?.pages.find(
                (page) => PluginUtil.normalisePath(page.path) === PluginUtil.normalisePath(path)
            );
            //@ts-ignore
            return s3UploadService.handleUploadRequest(request, h, page?.pageDef);
        };

        // GET / - Default route
        server.route({
            method: "get",
            path: "/",
            options: {
                description: "Default route - redirects to service start page",
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                if (config.serviceStartPage) {
                    return h.redirect(config.serviceStartPage);
                }
                throw Boom.notFound("No default form configured");
            }
        });

        // GET /published - List all published forms (for admin/designer use)
        server.route({
            method: "get",
            path: "/published",
            options: {
                description: "Lists all published forms from Pre-Award API",
                auth: config.jwtAuthEnabled === "true" ? jwtAuthStrategyName : false
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {adapterCacheService} = request.services([]);
                const forms = await adapterCacheService.getFormConfigurations(request);
                return h.response(JSON.stringify(forms)).code(200);
            }
        });

        // GET /{id} - Form start page
        server.route({
            method: "get",
            path: "/{id}",
            options: {
                description: "Form start page",
                pre: [
                    {method: queryParamPreHandler},
                    {method: checkUserSession}
                ],
                auth: config.jwtAuthEnabled === "true" ? jwtAuthStrategyName : false
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {id} = request.params;
                const {adapterCacheService} = request.services([]);
                
                // This will fetch from Pre-Award API if not cached
                const model = await adapterCacheService.getFormAdapterModel(id, request);
                
                if (model) {
                    return PluginUtil.getStartPageRedirect(request, h, id, model);
                }
                throw Boom.notFound(`Form '${id}' not found`);
            }
        });

        // GET /{id}/{path*} - Form pages
        server.route({
            method: "get",
            path: "/{id}/{path*}",
            options: {
                description: "Form page",
                pre: [
                    {method: queryParamPreHandler},
                    {method: checkUserSession}
                ],
                auth: config.jwtAuthEnabled === "true" ? jwtAuthStrategyName : false
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {path, id} = request.params;
                const {adapterCacheService} = request.services([]);
                
                const model = await adapterCacheService.getFormAdapterModel(id, request);
                
                const page = model?.pages.find(
                    (page) => PluginUtil.normalisePath(page.path) === PluginUtil.normalisePath(path)
                );
                
                if (page) {
                    return page.makeGetRouteHandler()(request, h);
                }
                
                if (PluginUtil.normalisePath(path) === "" && model) {
                    return PluginUtil.getStartPageRedirect(request, h, id, model);
                }
                
                throw Boom.notFound("Page not found");
            }
        });

        // POST /{id}/{path*} - Form submissions
        server.route({
            method: "post",
            path: "/{id}/{path*}",
            options: {
                description: "Form submission",
                plugins: <PluginSpecificConfiguration>{
                    "hapi-rate-limit": {
                        userPathLimit: 10
                    }
                },
                payload: {
                    output: "stream",
                    parse: true,
                    multipart: {output: "stream"},
                    maxBytes: s3UploadService.fileSizeLimit,
                    failAction: async (request: HapiRequest, h: HapiResponseToolkit) => {
                        //@ts-ignore
                        request.server.plugins.crumb.generate?.(request, h);
                        return h.continue;
                    }
                },
                pre: [{method: handleFiles}],
                auth: config.jwtAuthEnabled === "true" ? jwtAuthStrategyName : false
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {path, id} = request.params;
                const {adapterCacheService} = request.services([]);
                
                const model = await adapterCacheService.getFormAdapterModel(id, request);

                if (model) {
                    const page = model.pages.find(
                        (page) => page.path.replace(/^\//, "") === path.replace(/^\//, "")
                    );

                    if (page) {
                        return page.makePostRouteHandler()(request, h);
                    }
                }

                throw Boom.notFound("Page not found");
            }
        });
    }
}
