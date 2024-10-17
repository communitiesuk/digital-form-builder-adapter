import {RegisterApi} from "./RegisterApi";
import {HapiRequest, HapiResponseToolkit, HapiServer} from "../../../types";
import {Options} from "../types/PluginOptions";
import {FormPayload} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import Boom from "boom";
import {AdapterFormModel} from "../models";
import {FormConfiguration} from "@xgovformbuilder/model";
import {PluginUtil} from "../util/PluginUtil";
import {
    getValidStateFromQueryParameters
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/helpers";
import {PluginSpecificConfiguration} from "@hapi/hapi";
import {jwtAuthStrategyName} from "../Auth";
import {config} from "../../utils/AdapterConfigurationSchema";
import path from "path";
import fs from "fs";

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
        const {modelOptions, previewMode, forms} = options;
        const disabledRouteDetailString =
            "A request was made however previewing is disabled. See environment variable details in runner/README.md if this error is not expected.";

        server.route({
            method: "post",
            path: "/publish",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
            },
            handler: (request: HapiRequest, h: HapiResponseToolkit) => {
                if (!previewMode) {
                    request.logger.error(
                        [`POST /publish`, "previewModeError"],
                        disabledRouteDetailString
                    );
                    throw Boom.forbidden("Publishing is disabled");
                }
                const payload = request.payload as FormPayload;
                const {id, configuration} = payload;

                // translations that needs for the component level
                let translationEn = undefined
                let translationCy = undefined
                try {
                    const filePathCy = path.join(__dirname, '../../../../locales', `cy.json`);
                    const filePathEn = path.join(__dirname, '../../../../locales', `en.json`);
                    // @ts-ignore
                    const dataCy = fs.readFileSync(filePathCy, 'utf8');
                    const dataEn = fs.readFileSync(filePathEn, 'utf8');
                    translationEn = JSON.parse(dataEn);
                    translationCy = JSON.parse(dataCy);
                } catch (err) {
                    console.error(`Error reading translations`, err);
                    Boom.internal("Cannot read translations from the local folder")
                }

                const parsedConfiguration =
                    typeof configuration === "string"
                        ? JSON.parse(configuration)
                        : configuration;
                forms[id] = new AdapterFormModel(parsedConfiguration, {
                    ...modelOptions,
                    basePath: id,
                    translationEn: translationEn,
                    translationCy: translationCy
                });
                return h.response({}).code(204);
            }
        });

        server.route({
            method: "get",
            path: "/published/{id}",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
            },
            handler: (request: HapiRequest, h: HapiResponseToolkit) => {
                const {id} = request.params;
                if (!previewMode) {
                    request.logger.error(
                        [`GET /published/${id}`, "previewModeError"],
                        disabledRouteDetailString
                    );
                    throw Boom.unauthorized("publishing is disabled");
                }

                const form = forms[id];
                if (!form) {
                    return h.response({}).code(204);
                }

                const {values} = forms[id];
                return h.response(JSON.stringify({id, values})).code(200);
            }
        });

        server.route({
            method: "get",
            path: "/published",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
            },
            handler: (request: HapiRequest, h: HapiResponseToolkit) => {
                if (!previewMode) {
                    request.logger.error(
                        [`GET /published`, "previewModeError"],
                        disabledRouteDetailString
                    );
                    throw Boom.unauthorized("publishing is disabled.");
                }
                return h
                    .response(
                        JSON.stringify(
                            Object.keys(forms).map(
                                (key) =>
                                    new FormConfiguration(
                                        key,
                                        forms[key].name,
                                        undefined,
                                        forms[key].def.feedback?.feedbackForm
                                    )
                            )
                        )
                    )
                    .code(200);
            }
        });

        server.route({
            method: "get",
            path: "/",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
            },
            handler: (request: HapiRequest, h: HapiResponseToolkit) => {
                const keys = Object.keys(forms);
                let id = "";
                if (keys.length === 1) {
                    id = keys[0];
                }
                const model = forms[id];
                if (model) {
                    return PluginUtil.getStartPageRedirect(request, h, id, model);
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
            const model = forms[id];
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
            const {adapterCacheService} = request.services([]);
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
            handler: (request: HapiRequest, h: HapiResponseToolkit) => {
                const {id} = request.params;
                const model = forms[id];
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
            handler: (request: HapiRequest, h: HapiResponseToolkit) => {
                const {path, id} = request.params;
                const model = forms[id];
                const page = model?.pages.find(
                    (page) => PluginUtil.normalisePath(page.path) === PluginUtil.normalisePath(path)
                );
                if (page) {
                    return page.makeGetRouteHandler()(request, h);
                }
                if (PluginUtil.normalisePath(path) === "") {
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

        const handleFiles = (request: HapiRequest, h: HapiResponseToolkit) => {
            const {path, id} = request.params;
            const model = forms[id];
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
            const model = forms[id];

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
