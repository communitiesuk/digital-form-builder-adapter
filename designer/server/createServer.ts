import hapi from "@hapi/hapi";
import inert from "@hapi/inert";
import Scooter from "@hapi/scooter";
import logging from "../../digital-form-builder/designer/server/plugins/logging";
import router from "../../digital-form-builder/designer/server/plugins/router";
import {viewPlugin} from "../../digital-form-builder/designer/server/plugins/view";
import Schmervice from "schmervice";
import config from "../../digital-form-builder/designer/server/config";
import {determinePersistenceService} from "../../digital-form-builder/designer/server/lib/persistence";
import {configureBlankiePlugin} from "../../digital-form-builder/designer/server/plugins/blankie";
import {configureYarPlugin} from "../../digital-form-builder/designer/server/plugins/session";
import {designerPlugin} from "./plugins/DesignerRouteRegister";

const serverOptions = () => {
    return {
        port: process.env.PORT || 3000,
        router: {
            stripTrailingSlash: true,
        },
        routes: {
            validate: {
                options: {
                    abortEarly: false,
                },
            },
            security: {
                hsts: {
                    maxAge: 31536000,
                    includeSubDomains: true,
                    preload: false,
                },
                xss: 'enabled',
                noSniff: true,
                xframe: true,
            },
        },
    };
};

export async function createServer() {
    //@ts-ignore
    const server = hapi.server(serverOptions());
    await server.register(inert);
    await server.register(Scooter);
    //@ts-ignore
    await server.register(configureBlankiePlugin());
    //@ts-ignore
    await server.register(configureYarPlugin());
    await server.register(viewPlugin);
    await server.register(Schmervice);
    (server as any).registerService([
        Schmervice.withName(
            "persistenceService",
            determinePersistenceService(config.persistentBackend, server)
        ),
    ]);
    await server.register(designerPlugin);
    await server.register(router);
    await server.register(logging);

    return server;
}
