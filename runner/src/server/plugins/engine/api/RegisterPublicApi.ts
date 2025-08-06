import {RegisterApi} from "./RegisterApi";
import {HapiRequest, HapiResponseToolkit} from "../../../../../../digital-form-builder/runner/src/server/types";
import Joi from "joi";
import getRequestInfo from "../../../../../../digital-form-builder/runner/src/server/utils/getRequestInfo";
import {healthCheckRoute} from "../../../../../../digital-form-builder/runner/src/server/routes";
import path from "path";
import {config} from "../../utils/AdapterConfigurationSchema";
import {redirectTo} from "../util/helper";

enum CookieValue {
    Accept = "accept",
    Reject = "reject",
}

type Cookies = "accept" | "reject";

interface CookiePayload {
    cookies: Cookies;
    crumb: string;
    referrer: string;
}

const adapterRunnerFolder = path.join(__dirname, "..", "..", "..", "..");
const rootNodeModules = path.join(adapterRunnerFolder, "..", "..", "..", "..", "node_modules");
const govukFolder = path.join(
    adapterRunnerFolder, "..", "..", "..", "..", "runner",
    "node_modules",
    "govuk-frontend",
    "dist",
    "govuk"
);

export class RegisterPublicApi implements RegisterApi {
    register(server: any): void {

        server.route(healthCheckRoute);
        server.route([
            {
                method: "GET",
                path: "/assets/{path*}",
                options: {
                    description: "See API-README.md file in the runner/src/server/plugins/engine/api",
                    handler: {
                        directory: {
                            path: [
                                path.join(adapterRunnerFolder, "public", "static"),
                                path.join(adapterRunnerFolder, "public", "build"),
                                path.join(adapterRunnerFolder, "public"),
                                govukFolder,
                                path.join(govukFolder, "assets"),
                                path.join(rootNodeModules, "hmpo-components", "assets"),
                                path.join(rootNodeModules, "tinymce"),
                                path.join(rootNodeModules, "dropzone", "dist", "min"),
                            ],
                        },
                    },
                },
            }
        ]);
        server.route([
            {
                method: "get",
                path: "/help/privacy",
                options: {
                    description: "See API-README.md file in the runner/src/server/plugins/engine/api",
                },
                handler: async (_request: HapiRequest, h: HapiResponseToolkit) => {
                    if (config.privacyPolicyUrl) {
                        return h.redirect(config.privacyPolicyUrl);
                    }
                    return h.view("help/privacy");
                },
            },
            {
                method: "get",
                path: "/help/cookies",
                options: {
                    description: "See API-README.md file in the runner/src/server/plugins/engine/api",
                },
                handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                    const cookiesPolicy = request.state.cookies_policy;
                    let analytics =
                        cookiesPolicy?.analytics === "on" ? "accept" : "reject";
                    return h.view("help/cookies", {
                        analytics,
                    });
                },
            },
            {
                method: "post",
                options: {
                    description: "See API-README.md file in the runner/src/server/plugins/engine/api",
                    payload: {
                        parse: true,
                        multipart: true,
                        failAction: async (
                            request: HapiRequest,
                            h: HapiResponseToolkit
                        ) => {
                            //@ts-ignore
                            request.server.plugins.crumb.generate?.(request, h);
                            return h.continue;
                        },
                    },
                    validate: {
                        payload: Joi.object({
                            cookies: Joi.string()
                                .valid(CookieValue.Accept, CookieValue.Reject)
                                .required(),
                            crumb: Joi.string(),
                        }).required(),
                    },
                },
                path: "/help/cookies",
                handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                    const {cookies} = request.payload as CookiePayload;
                    const accept = cookies === "accept";

                    const {referrer} = getRequestInfo(request);
                    let redirectPath = "/help/cookies";

                    if (referrer) {
                        redirectPath = new URL(referrer).pathname;
                    }

                    return h.redirect(redirectPath).state(
                        "cookies_policy",
                        {
                            isHttpOnly: false, // Set this to false so that Google tag manager can read cookie preferences
                            isSet: true,
                            essential: true,
                            analytics: accept ? "on" : "off",
                            usage: accept,
                        },
                        {
                            isHttpOnly: false,
                            path: "/",
                        }
                    );
                },
            },
        ]);

        server.route({
            method: "get",
            path: "/help/terms-and-conditions",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
            },
            handler: async (_request: HapiRequest, h: HapiResponseToolkit) => {
                return h.view("help/terms-and-conditions");
            },
        });

        server.route({
            method: "get",
            path: "/help/accessibility-statement",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
            },
            handler: async (_request: HapiRequest, h: HapiResponseToolkit) => {
                return h.view("help/accessibility-statement");
            },
        });

        server.route({
            method: "get",
            path: "/clear-session",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                if (request.yar) {
                    request.yar.reset();
                }
                const {redirect} = request.query;
                //@ts-ignore
                return redirectTo(request, h, (redirect as string) || "/");
            },
        });

        server.route({
            method: "get",
            path: "/timeout",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                if (request.yar) {
                    request.yar.reset();
                }

                let startPage = "/";

                const {referer} = request.headers;

                if (referer) {
                    const match = referer.match(/https?:\/\/[^/]+\/([^/]+).*/);
                    if (match && match.length > 1) {
                        startPage = `/${match[1]}`;
                    }
                }

                return h.view("timeout", {
                    startPage,
                });
            },
        });
    }
}
