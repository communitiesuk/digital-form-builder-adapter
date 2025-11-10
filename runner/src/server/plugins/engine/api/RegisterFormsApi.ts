import {RegisterApi} from "./RegisterApi";
import {HapiRequest, HapiResponseToolkit, HapiServer} from "../../../types";
// @ts-ignore
import Boom from "boom";
import {PluginUtil} from "../util/PluginUtil";
import {
    getValidStateFromQueryParameters
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/helpers";
import {PluginSpecificConfiguration} from "@hapi/hapi";
import {jwtAuthStrategyName} from "../Auth";
import {config} from "../../utils/AdapterConfigurationSchema";
import {FormNamespace, getNamespaceFromRequest} from "../../../services/AdapterCacheService";

export class RegisterFormsApi implements RegisterApi {
    register(server: HapiServer) {
        const {s3UploadService} = server.services([]);

        // Middleware to prepopulate fields from query parameters
        const queryParamPreHandler = async (
            request: HapiRequest,
            h: HapiResponseToolkit
        ) => {
            const {query} = request;
            const {id} = request.params;
            const {adapterCacheService} = request.services([]);
            // Determine namespace - applicants vs preview users
            const namespace = getNamespaceFromRequest(request);
            const model = await adapterCacheService.getFormAdapterModel(id, request, namespace);
            if (!model) {
                throw Boom.notFound("No form found for id");
            }
            const prePopFields = model.fieldsForPrePopulation;
            if (
                Object.keys(query).length === 0 ||
                Object.keys(prePopFields).length === 0
            ) {
                return h.continue;
            }
            // @ts-ignore
            const state = await adapterCacheService.getState(request);
            const newValues = getValidStateFromQueryParameters(
                prePopFields,
                query,
                state
            );
            // @ts-ignore
            await adapterCacheService.mergeState(request, newValues);
            if (Object.keys(newValues).length > 0) {
                h.request.pre.hasPrepopulatedSessionFromQueryParameter = true;
            }
            return h.continue;
        };

        // Middleware to check if the user session is still valid
        const checkUserSession = async (
            request: HapiRequest,
            h: HapiResponseToolkit
        ) => {
            const {adapterCacheService} = request.services([]);
            // @ts-ignore
            const state = await adapterCacheService.getState(request);
            // Only enforce session validation in production environments
            const isProduction = config.copilotEnv === "production" || config.copilotEnv === "prod";
            // Don't enforce callback check for preview sessions (FAB previews, Form Designer)
            const formSessionId = request.query.form_session_identifier as string;
            const isPreview = formSessionId?.startsWith("preview");
            if (isProduction && !isPreview && !state.callback) {
                // if you are here the session likely dropped
                request.logger.error(["checkUserSession"], `Session expired ${request.yar.id}`);
                throw Boom.clientTimeout("Session expired");
            }
            return h.continue;
        }

        // Middleware to handle file uploads
        const handleFiles = async (request: HapiRequest, h: HapiResponseToolkit) => {
            const {path, id} = request.params;
            const {adapterCacheService} = request.services([]);
            // Determine namespace - applicants use permanent, previews use preview
            const namespace = getNamespaceFromRequest(request);
            const model = await adapterCacheService.getFormAdapterModel(id, request, namespace);
            const page = model?.pages.find(
                (page) => PluginUtil.normalisePath(page.path) === PluginUtil.normalisePath(path)
            );
            // @ts-ignore
            return s3UploadService.handleUploadRequest(request, h, page.pageDef);
        };

        server.route({
            method: "get",
            path: "/",
            options: {
                description: "Default route - redirects to a default form if configured",
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {adapterCacheService} = request.services([]);
                // Default route - always use permanent namespace for the "components" form
                const model = await adapterCacheService.getFormAdapterModel(
                    "components",
                    request,
                    FormNamespace.Permanent
                );
                if (model) {
                    return PluginUtil.getStartPageRedirect(request, h, "components", model);
                }
                if (config.serviceStartPage) {
                    return h.redirect(config.serviceStartPage);
                }
                throw Boom.notFound("No default form found");
            }
        });

        server.route({
            method: "get",
            path: "/{id}",
            options: {
                description: "Form start page",
                pre: [{method: queryParamPreHandler}, {method: checkUserSession}]
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {id} = request.params;
                const {adapterCacheService} = request.services([]);
                // Determine namespace - applicants use permanent, previews use preview
                const namespace = getNamespaceFromRequest(request);
                const model = await adapterCacheService.getFormAdapterModel(id, request, namespace);
                if (model) {
                    return PluginUtil.getStartPageRedirect(request, h, id, model);
                }
                throw Boom.notFound("No form found for id");
            }
        });

        server.route({
            method: "get",
            path: "/{id}/{path*}",
            options: {
                description: "Form page",
                pre: [{method: queryParamPreHandler}, {method: checkUserSession}],
                auth: config.jwtAuthEnabled && config.jwtAuthEnabled === "true" ? jwtAuthStrategyName : false
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {path, id} = request.params;
                const {adapterCacheService} = request.services([]);
                // Determine namespace - applicants use permanent, previews use preview
                const namespace = getNamespaceFromRequest(request);
                const model = await adapterCacheService.getFormAdapterModel(id, request, namespace);
                const page = model?.pages.find(
                    (page) => PluginUtil.normalisePath(page.path) === PluginUtil.normalisePath(path)
                );
                if (page) {
                    return page.makeGetRouteHandler()(request, h);
                }
                if (PluginUtil.normalisePath(path) === "" && model) {
                    return PluginUtil.getStartPageRedirect(request, h, id, model);
                }
                throw Boom.notFound("No form or page found");
            }
        });

        server.route({
            method: "post",
            path: "/{id}/{path*}",
            options: {
                description: "Form page submission",
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
                        // @ts-ignore
                        request.server.plugins.crumb.generate?.(request, h);
                        return h.continue;
                    }
                },
                pre: [{method: handleFiles}],
                auth: config.jwtAuthEnabled && config.jwtAuthEnabled === "true" ? jwtAuthStrategyName : false,
                handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                    const {path, id} = request.params;
                    const {adapterCacheService} = request.services([]);
                    // Determine namespace - applicants use permanent, previews use preview
                    const namespace = getNamespaceFromRequest(request);
                    const model = await adapterCacheService.getFormAdapterModel(id, request, namespace);

                    if (model) {
                        const page = model.pages.find(
                            (page) => page.path.replace(/^\//, "") === path.replace(/^\//, "")
                        );

                        if (page) {
                            return page.makePostRouteHandler()(request, h);
                        }
                    }

                    throw Boom.notFound("No form of path found");
                }
            }
        });
    }
}