import pino from "hapi-pino";
import {config} from "./utils/AdapterConfigurationSchema";

export default {
    plugin: pino,
    options: {
        prettyPrint: false,
        level: config.logLevel,
        base: null,
        formatters: {
            level: (label) => {
                return {severity: label.toUpperCase()}; // Align severity levels for CloudWatch
            },
        },
        messageKey: "message",
        customProps: (request) => ({
            requestId: request.info.id, // Include request ID
            userAgent: request.headers["user-agent"], // Add user agent for context
            route: request.route.path, // Include route information
        }),
        serializers: {
            req: () => undefined,
            res: () => undefined,
        },
        hooks: {
            logMethod(inputArgs, method) {
                let [obj, ...rest] = inputArgs;
                if (typeof obj === "object") {
                    if (obj.req) {
                        //@ts-ignore
                        obj = {
                            ...obj,
                            requestInfoId: obj.req.info.id,
                            requestId: obj.req.yar.id,
                            userAgent: obj.req.headers["user-agent"]
                        };
                        if (obj.req.path) {
                            obj.path = obj.req.path;
                        }
                        if (obj.req.query) {
                            obj.query = obj.req.query;
                        }
                        if (obj.req.method) {
                            obj.method = obj.req.method.toUpperCase();
                        }
                        if (obj.req.yar.id) {
                            obj.requestId = obj.req.yar.id;
                        }
                        delete obj.req
                        delete obj.res
                    }
                    delete obj.req
                    delete obj.res
                    return method.apply(this, [obj, ...rest]);
                }
                return method.apply(this, inputArgs);
            },
        },
        redact: {
            paths: config.logRedactPaths || ["req.headers.authorization"],
            censor: null,
        },
        ignoreFunc: (_options, request) =>
            request.path.startsWith("/assets"),
        debug: config.isDev,
        logRequestStart: config.isDev,
        logRequestComplete: config.isDev,
    },
};

