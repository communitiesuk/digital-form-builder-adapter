import hapi, {ServerOptions} from "@hapi/hapi";
import inert from "@hapi/inert";
import Scooter from "@hapi/scooter";
import logging from "../../digital-form-builder/designer/server/plugins/logging";
import router from "../../digital-form-builder/designer/server/plugins/router";
import {viewPlugin} from "../../digital-form-builder/designer/server/plugins/view";
import Schmervice from "schmervice";
import {determinePersistenceService} from "../../digital-form-builder/designer/server/lib/persistence";
import {configureBlankiePlugin} from "../../digital-form-builder/designer/server/plugins/blankie";
import {configureYarPlugin} from "../../digital-form-builder/designer/server/plugins/session";
import {designerPlugin} from "./plugins/DesignerRouteRegister";
import errorHandlerPlugin from "./plugins/ErrorHandlerPlugin";
import authPlugin from "./plugins/AuthPlugin";
import fs from "fs";
import config from "./config";

const serverOptions = () => {
    const hasCertificate = config.sslKey && config.sslCert;

    const serverOptions: ServerOptions = {
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

    const httpsOptions = hasCertificate
        ? {
            tls: {
                key: fs.readFileSync(config.sslKey),
                cert: fs.readFileSync(config.sslCert),
            },
        }
        : {};

    return {
        ...serverOptions,
        ...httpsOptions,
    };
};

export async function createServer() {
    //@ts-ignore
    const server = hapi.server(serverOptions());
    await server.register(errorHandlerPlugin);
    //@ts-ignore
    await server.register(authPlugin);
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
    server.ext('onPreResponse', (request, h) => {
        const response = h.response(request.response);
        response.header('Content-Security-Policy', "style-src 'self' 'unsafe-inline'");
        return response;
    });
    await server.register(designerPlugin);
    await server.register(router);
    await server.register(logging);

    return server;
}
