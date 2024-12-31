import {newConfig, api, app} from "../../../digital-form-builder/designer/server/plugins/routes";
import {envStore, flagg} from "flagg";
import {putFormWithIdRouteRegister} from "./routes/PutFormWithIdRouteRegister";
import config from "../config";
import {jwtAuthStrategyName} from "./AuthPlugin";

export const designerPlugin = {
    plugin: {
        name: "designerPlugin",
        multiple: true,
        dependencies: "vision",
        register: async (server) => {
            const loginRoute = {
                method: "get",
                path: "/login",
                options: {
                    handler: async (_request, h) => {
                        return h.view("login", {
                            ssoLoginUrl: config.authServiceUrl + config.ssoLoginUrl
                        });
                    },
                },
            }

            server.route(loginRoute);

            const logOutRoute = {
                method: "post",
                path: "/logout",
                options: {
                    handler: async (_request, h) => {
                        return h.redirect(config.authServiceUrl + config.ssoLogoutUrl);
                    },
                },
            }

            server.route(logOutRoute);

            const startRoute = {
                method: "get",
                path: "/",
                options: {
                    handler: async (_request, h) => {
                        return h.redirect("/app");
                    },
                },
            }

            // @ts-ignore
            if (config.authEnabled) {
                // @ts-ignore
                startRoute.options.auth = jwtAuthStrategyName
                // @ts-ignore
                app.getApp.options.auth = jwtAuthStrategyName
                // @ts-ignore
                app.redirectNewToApp.options.auth = jwtAuthStrategyName
                // @ts-ignore
                app.getAppChildRoutes.options.auth = jwtAuthStrategyName
                // @ts-ignore
                app.getErrorCrashReport.options.auth = jwtAuthStrategyName
                // @ts-ignore
                app.redirectOldUrlToDesigner.options.auth = jwtAuthStrategyName
                // @ts-ignore
                newConfig.registerNewFormWithRunner.options.auth = jwtAuthStrategyName
                // @ts-ignore
                api.getFormWithId.options.auth = jwtAuthStrategyName
                // @ts-ignore
                putFormWithIdRouteRegister.options.auth = jwtAuthStrategyName
                // @ts-ignore
                api.getAllPersistedConfigurations.options.auth = jwtAuthStrategyName
                // @ts-ignore
                api.log.options.auth = jwtAuthStrategyName
            }

            server.route(startRoute);

            // This is old url , redirecting it to new
            server.route(app.redirectNewToApp);

            server.route(app.getApp);

            server.route(app.getAppChildRoutes);

            server.route(app.getErrorCrashReport);

            // This is an old url, redirecting it to new
            server.route(app.redirectOldUrlToDesigner);

            server.route({
                method: "GET",
                path: "/feature-toggles",
                options: {
                    //@ts-ignore
                    handler: async (request, h) => {
                        const featureFlags = flagg({
                            store: envStore(process.env),
                            definitions: {
                                featureEditPageDuplicateButton: {default: false},
                            },
                        });

                        return h
                            .response(JSON.stringify(featureFlags.getAllResolved()))
                            .code(200);
                    },
                },
            });

            server.route(newConfig.registerNewFormWithRunner);
            server.route(api.getFormWithId);
            server.route(putFormWithIdRouteRegister);
            server.route(api.getAllPersistedConfigurations);
            server.route(api.log);
        },
    },
};
