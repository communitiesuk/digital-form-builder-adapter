import {RegisterApi} from "./RegisterApi";
import {HapiRequest, HapiResponseToolkit, HapiServer} from "../../../types";
import {Options} from "../types/PluginOptions";
import {FormPayload} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
// @ts-ignore
import Boom from "boom";
import {PluginUtil} from "../util/PluginUtil";
import {
    getValidStateFromQueryParameters
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/helpers";
import {PluginSpecificConfiguration} from "@hapi/hapi";
import {jwtAuthStrategyName} from "../Auth";
import {config} from "../../utils/AdapterConfigurationSchema";

export class RegisterFormPublishApi implements RegisterApi {

    /**
     * The following publish endpoints (/publish, /published/{id}, /published)
     * are used from the designer for operating in 'preview' mode.
     * I.E. Designs saved in the designer can be accessed in the runner for viewing.
     * The designer also uses these endpoints as a persistence mechanism for storing and retrieving data
     * for its own purposes so if you're changing these endpoints you likely need to go and amend
     * the designer too!
     */
    register(server: HapiServer, options: Options) {
        const {previewMode} = options;
        const disabledRouteDetailString =
            "A request was made however previewing is disabled. See environment variable details in runner/README.md if this error is not expected.";

        server.route({
            method: "post",
            path: "/publish",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {adapterCacheService} = request.services([]);
                // @ts-ignore
                if (!previewMode || previewMode==="false") {
                    request.logger.error(
                        [`POST /publish`, "previewModeError"],
                        disabledRouteDetailString
                    );
                    throw Boom.forbidden("Publishing is disabled");
                }
                const payload = request.payload as FormPayload;
                const {id, configuration} = payload;

                const parsedConfiguration =
                    typeof configuration === "string"
                        ? JSON.parse(configuration)
                        : configuration;
                if (parsedConfiguration.configuration) {
                    await adapterCacheService.setFormConfiguration(id, parsedConfiguration, request.server)
                } else {
                    await adapterCacheService.setFormConfiguration(id, {configuration: parsedConfiguration}, request.server)
                }
                return h.response({}).code(204);
            }
        });

        server.route({
            method: "get",
            path: "/published/{id}",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {id} = request.params;
                // @ts-ignore
                if (!previewMode || previewMode==="false") {
                    request.logger.error(
                        [`GET /published/${id}`, "previewModeError"],
                        disabledRouteDetailString
                    );
                    throw Boom.unauthorized("publishing is disabled");
                }
                const {adapterCacheService} = request.services([]);
                const form = await adapterCacheService.getFormAdapterModel(id, request);
                if (!form) {
                    return h.response({}).code(204);
                }
                const {values} = await adapterCacheService.getFormAdapterModel(id, request);
                return h.response(JSON.stringify({id, values})).code(200);
            }
        });

        server.route({
            method: "get",
            path: "/published",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {adapterCacheService} = request.services([]);
                // @ts-ignore
                if (!previewMode || previewMode==="false") {
                    request.logger.error(
                        [`GET /published`, "previewModeError"],
                        disabledRouteDetailString
                    );
                    throw Boom.unauthorized("publishing is disabled.");
                }
                return h
                    .response(JSON.stringify(await adapterCacheService.getFormConfigurations(request)))
                    .code(200);
            }
        });

        server.route({
            method: "get",
            path: "/",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {adapterCacheService} = request.services([]);
                const model = await adapterCacheService.getFormAdapterModel("components", request);
                if (model) {
                    return PluginUtil.getStartPageRedirect(request, h, "components", model);
                }
                if (config.serviceStartPage) {
                    return h.redirect(config.serviceStartPage);
                }
                throw Boom.notFound("No default form found");
            }
        });

        const queryParamPreHandler = async (
            request: HapiRequest,
            h: HapiResponseToolkit
        ) => {
            const {query} = request;
            const {id} = request.params;
            const {adapterCacheService} = request.services([]);
            const model = await adapterCacheService.getFormAdapterModel(id, request);
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

        server.route({
            method: "get",
            path: "/{id}",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
                pre: [
                    {
                        method: queryParamPreHandler
                    }
                ]
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {id} = request.params;
                const {adapterCacheService} = request.services([]);
                const model = await adapterCacheService.getFormAdapterModel(id, request);
                if (model) {
                    return PluginUtil.getStartPageRedirect(request, h, id, model);
                }
                throw Boom.notFound("No form found for id");
            }
        });

        const getOptions: any = {
            method: "get",
            path: "/{id}/{path*}",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
                pre: [
                    {
                        method: queryParamPreHandler
                    }
                ],
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
                throw Boom.notFound("No form or page found");
            }
        }

        if (config.jwtAuthEnabled && config.jwtAuthEnabled === "true") {
            getOptions.options.auth = jwtAuthStrategyName
        }

        server.route(getOptions);

        const {s3UploadService} = server.services([]);

        const handleFiles = async (request: HapiRequest, h: HapiResponseToolkit) => {
            const {path, id} = request.params;
            const {adapterCacheService} = request.services([]);
            const model = await adapterCacheService.getFormAdapterModel(id, request);
            const page = model?.pages.find(
                (page) => PluginUtil.normalisePath(page.path) === PluginUtil.normalisePath(path)
            );
            // @ts-ignore
            return s3UploadService.handleUploadRequest(request, h, page.pageDef);
        };

        const postHandler = async (
            request: HapiRequest,
            h: HapiResponseToolkit
        ) => {
            const {path, id} = request.params;
            const {adapterCacheService} = request.services([]);
            const model = await adapterCacheService.getFormAdapterModel(id, request);

            if (model) {
                const page = model.pages.find(
                    (page) => page.path.replace(/^\//, "") === path
                );

                if (page) {
                    return page.makePostRouteHandler()(request, h);
                }
            }

            throw Boom.notFound("No form of path found");
        };

        let postConfig: any = {
            method: "post",
            path: "/{id}/{path*}",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
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
                handler: postHandler,
            }
        }
        if (config.jwtAuthEnabled && config.jwtAuthEnabled === "true") {
            postConfig.options.auth = jwtAuthStrategyName
        }
        server.route(postConfig);

    }


}
