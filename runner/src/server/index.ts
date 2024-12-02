// @ts-ignore
import fs from "fs";
// @ts-ignore
import hapi, {ServerOptions} from "@hapi/hapi";

import Scooter from "@hapi/scooter";
import inert from "@hapi/inert";
import Schmervice from "schmervice";
import blipp from "blipp";

import {ConfigureFormsPlugin} from "./plugins/ConfigureFormsPlugin";
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
import logging from "./plugins/logging";

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
        cache: [{provider: catboxProvider()}],
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
        if (request.state && request.state.language) {
            const language = request.state.language;
            // Set the language based on the request state
            if (language) {
                request.i18n.setLocale(language);  // Ensure request.i18n is set properly
            } else {
                request.i18n.setLocale("en");
            }
        } else if (request.query && request.query.lang) {
            const language = request.query.lang;
            // Set the language based on the request state
            if (language) {
                request.i18n.setLocale(language);  // Ensure request.i18n is set properly
            } else {
                request.i18n.setLocale("en");
            }
        } else {
            request.i18n.setLocale("en");
        }
    }
}

async function createServer(routeConfig: RouteConfig) {
    console.log("SERVER CREATING")
    const server = hapi.server(await serverOptions());
    // @ts-ignore
    const {formFileName, formFilePath, options} = routeConfig;

    if (config.rateLimit) {
        await server.register(configureRateLimitPlugin(routeConfig));
    }
    await server.register(logging);
    await server.register(pluginSession);
    await server.register(pluginPulse);
    await server.register(inert);
    await server.register(Scooter);
    await server.register(configureInitialiseSessionPlugin({safelist: config.safelist,}));
    // @ts-ignore
    await server.register(configureBlankiePlugin(config));
    // @ts-ignore
    await server.register(configureCrumbPlugin(config, routeConfig));
    await server.register(Schmervice);
    await server.register(pluginAuth);
    await server.register(LanguagePlugin);

    server.registerService([AdapterCacheService, NotifyService, PayService, WebhookService, AddressService, TranslationLoaderService]);
    if (config.isE2EModeEnabled && config.isE2EModeEnabled == "true") {
        console.log("E2E Mode enabled")
        server.registerService([Schmervice.withName("s3UploadService", MockUploadService),]);
    } else {
        server.registerService([S3UploadService]);
    }

    // @ts-ignore
    server.registerService(AdapterStatusService);

    server.ext(
        "onPreResponse",
        (request: HapiRequest, h: HapiResponseToolkit) => {
            const {response} = request;

            if ("isBoom" in response && response.isBoom) {
                return h.continue;
            }

            if ("header" in response && response.header) {
                response.header("X-Robots-Tag", "noindex, nofollow");

                const existingHeaders = response.headers;
                const existingCsp = existingHeaders["content-security-policy"] || "";
                if (typeof existingCsp === "string") {
                    const newCsp = existingCsp?.replace(
                        /connect-src[^;]*/,
                        `connect-src 'self' https://${config.awsBucketName}.s3.${config.awsRegion}.amazonaws.com/`
                    );
                    response.header("Content-Security-Policy", newCsp);
                }

                const WEBFONT_EXTENSIONS = /\.(?:eot|ttf|woff|svg|woff2)$/i;
                if (!WEBFONT_EXTENSIONS.test(request.url.toString())) {
                    response.header(
                        "cache-control",
                        "private, no-cache, no-store, must-revalidate, max-age=0"
                    );
                    response.header("pragma", "no-cache");
                    response.header("expires", "0");
                } else {
                    response.header("cache-control", "public, max-age=604800, immutable");
                }
            }
            return h.continue;
        }
    );

    server.ext("onPreHandler", (request: HapiRequest, h: HapiResponseToolkit) => {
        determineLocal(request);
        return h.continue;
    });

    server.ext('onPreAuth', (request, h) => {
        if (config.jwtAuthCookieName && request.state) {
            const authCookie = request.state[config.jwtAuthCookieName];
            const authHeader = request.headers.authorization;
            request.logger.info(`[AUTH] Path: ${request.path} | Auth Cookie: ${authCookie ? 'Present' : 'Missing'} | Auth Header: ${authHeader ? 'Present' : 'Missing'}`);
        }
        return h.continue;
    });

    server.ext("onRequest", (request: HapiRequest, h: HapiResponseToolkit) => {
        if (config.jwtAuthCookieName && request.state) {
            const authCookie = request.state[config.jwtAuthCookieName];
            const authHeader = request.headers.authorization;
            request.logger.info(`[AUTH] Path: ${request.path} | Auth Cookie: ${authCookie ? 'Present' : 'Missing'} | Auth Header: ${authHeader ? 'Present' : 'Missing'}`);
        }
        // @ts-ignore
        const {pathname} = getRequestInfo(request);
        //@ts-ignore
        request.app.location = pathname;
        determineLocal(request);
        return h.continue;
    });

    // @ts-ignore
    await server.register(ViewLoaderPlugin);
    // @ts-ignore
    await server.register(ConfigureFormsPlugin(formFileName, formFilePath, options));
    await server.register(pluginApplicationStatus);
    await server.register(publicRouterPlugin);
    await server.register(errorHandlerPlugin);
    await server.register(clientSideUploadPlugin);
    await server.register(blipp);

    server.state("cookies_policy", {
        encoding: "base64json",
    });
    return server;
}

export default createServer;
