import fs from "fs";
import "../instrument";
import hapi, {ServerOptions} from "@hapi/hapi";
import Scooter from "@hapi/scooter";
import inert from "@hapi/inert";
import Schmervice from "schmervice";
import blipp from "blipp";

import {configureRateLimitPlugin} from "../../../digital-form-builder/runner/src/server/plugins/rateLimit";
import {configureBlankiePlugin} from "../../../digital-form-builder/runner/src/server/plugins/blankie";
import {configureCrumbPlugin} from "../../../digital-form-builder/runner/src/server/plugins/crumb";

import pluginSession from "../../../digital-form-builder/runner/src/server/plugins/session";
import pluginAuth from "./plugins/engine/Auth";
import pluginApplicationStatus from "./plugins/engine/application-status";
import pluginPulse from "../../../digital-form-builder/runner/src/server/plugins/pulse";
import {
    AddressService,
    NotifyService,
    PayService,
} from "../../../digital-form-builder/runner/src/server/services";
import {HapiRequest, HapiResponseToolkit, RouteConfig} from "./types";
import getRequestInfo from "../../../digital-form-builder/runner/src/server/utils/getRequestInfo";
import {ViewLoaderPlugin} from "./plugins/ViewLoaderPlugin";
import publicRouterPlugin from "./plugins/engine/PublicRouterPlugin";
import { FormRoutesPlugin } from "./plugins/engine/FormRoutesPlugin";
import {config} from "./plugins/utils/AdapterConfigurationSchema";
import errorHandlerPlugin from "./plugins/ErrorHandlerPlugin";
import {AdapterCacheService} from "./services";
import {AdapterStatusService} from "./services";
import {configureInitialiseSessionPlugin} from "./plugins/initialize-session/SessionManagementPlugin";
import {S3UploadService} from "./services";
import clientSideUploadPlugin from "./plugins/ClientSideUploadPlugin";
import {MockUploadService} from "./services/MockUploadService";
import {catboxProvider} from "./services/AdapterCacheService";
import LanguagePlugin from "./plugins/LanguagePlugin";
import {TranslationLoaderService} from "./services/TranslationLoaderService";
import {WebhookService} from "./services/WebhookService";
import {PreAwardApiService} from "./services/PreAwardApiService";
import {pluginLog} from "./plugins/logging";

const Sentry = require('@sentry/node');

const serverOptions = async (): Promise<ServerOptions> => {
    const hasCertificate = config.sslKey && config.sslCert;

    const serverOptions: ServerOptions = {
        debug: {request: [`${config.isDev}`]},
        port: config.port,
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
                xss: "enabled",
                noSniff: true,
                xframe: true,
            },
        },
        cache: [{provider: catboxProvider()}],  // Will throw if Redis not configured
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

function determineLocal(request: any) {
    if (request.i18n) {
        const language = request.state?.language || request.query?.lang || "en";
        request.i18n.setLocale(language);
        if (request.query?.lang && request.query.lang !== request.yar.get("lang")) {
            request.yar.set("lang", request.query.lang);
        }
    }
}

async function createServer(routeConfig: RouteConfig) {
    console.log("*** FORM RUNNER SERVER STARTING ***")
    const server = hapi.server(await serverOptions());
    
    // Core plugins
    if (config.rateLimit) {
        await server.register(configureRateLimitPlugin(routeConfig));
    }
    
    await server.register(pluginLog);
    await server.register(pluginSession);
    await server.register(pluginPulse);
    await server.register(inert);
    await server.register(Scooter);
    await server.register(configureInitialiseSessionPlugin({safelist: config.safelist}));
    //@ts-ignore
    await server.register(configureBlankiePlugin(config));
    //@ts-ignore
    await server.register(configureCrumbPlugin(config, routeConfig));
    await server.register(Schmervice);
    await server.register(pluginAuth);
    await server.register(LanguagePlugin);

    // Register services in dependency order
    server.registerService([PreAwardApiService]);
    server.registerService([
        AdapterCacheService, 
        NotifyService, 
        PayService, 
        WebhookService, 
        AddressService, 
        TranslationLoaderService
    ]);
    
    // Upload service
    if (config.isE2EModeEnabled === "true") {
        console.log("E2E Mode enabled - using mock upload service")
        server.registerService([Schmervice.withName("s3UploadService", MockUploadService)]);
    } else {
        server.registerService([S3UploadService]);
    }

    //@ts-ignore
    server.registerService(AdapterStatusService);

    // Response headers
    server.ext("onPreResponse", (request: HapiRequest, h: HapiResponseToolkit) => {
        const {response} = request;

        if ("isBoom" in response && response.isBoom && 
            response?.output?.statusCode >= 500 && 
            response?.output?.statusCode < 600) {
            Sentry.captureException(response);
        }

        if ("header" in response && response.header) {
            response.header("X-Robots-Tag", "noindex, nofollow");

            const existingCsp = response.headers["content-security-policy"];
            if (typeof existingCsp === "string") {
                const newCsp = existingCsp.replace(
                    /connect-src[^;]*/,
                    `connect-src 'self' https://${config.awsBucketName}.s3.${config.awsRegion}.amazonaws.com/`
                );
                response.header("Content-Security-Policy", newCsp);
            }

            // Cache control
            const WEBFONT_EXTENSIONS = /\.(?:eot|ttf|woff|svg|woff2)$/i;
            if (WEBFONT_EXTENSIONS.test(request.url.toString())) {
                response.header("cache-control", "public, max-age=604800, immutable");
            } else {
                response.header("cache-control", "private, no-cache, no-store, must-revalidate, max-age=0");
                response.header("pragma", "no-cache");
                response.header("expires", "0");
            }
        }
        
        return h.continue;
    });

    // Request lifecycle handlers
    server.ext("onPreHandler", (request: HapiRequest, h: HapiResponseToolkit) => {
        determineLocal(request);
        return h.continue;
    });

    server.ext("onRequest", (request: HapiRequest, h: HapiResponseToolkit) => {
        //@ts-ignore
        const {pathname} = getRequestInfo(request);
        //@ts-ignore
        request.app.location = pathname;
        determineLocal(request);
        return h.continue;
    });

    // Register application plugins
    //@ts-ignore
    await server.register(ViewLoaderPlugin);
    await server.register(FormRoutesPlugin);
    await server.register(pluginApplicationStatus);
    await server.register(publicRouterPlugin);
    await server.register(errorHandlerPlugin);
    await server.register(clientSideUploadPlugin);
    await server.register(blipp);

    server.state("cookies_policy", {
        encoding: "base64json",
    });

    // Error monitoring
    await Sentry.setupHapiErrorHandler(server);
    
    return server;
}

export default createServer;
