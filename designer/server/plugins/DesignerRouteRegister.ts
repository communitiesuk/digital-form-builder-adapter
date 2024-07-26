import pkg from "../../package.json";
import {newConfig, api, app} from "../../../digital-form-builder/designer/server/plugins/routes";
import {envStore, flagg} from "flagg";
import {putFormWithIdRouteRegister} from "./routes/PutFormWithIdRouteRegister";

export const designerPlugin = {
    plugin: {
        name: pkg.name,
        version: pkg.version,
        multiple: true,
        dependencies: "vision",
        register: async (server) => {
            server.route({
                method: "get",
                path: "/",
                options: {
                    handler: async (_request, h) => {
                        return h.redirect("/app");
                    },
                },
            });

            // This is old url , redirecting it to new
            server.route(app.redirectNewToApp);

            server.route(app.getApp);

            server.route(app.getAppChildRoutes);

            server.route(app.getErrorCrashReport);

            // This is old url , redirecting it to new
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
