import pino from "hapi-pino";
import {config} from "./utils/AdapterConfigurationSchema";

export default {
    plugin: pino,
    options: {
        prettyPrint: config.logPrettyPrint === "true" || config.logPrettyPrint === true,
        level: config.logLevel,
        base: null,
        formatters: {
            level: (label) => {
                return {severity: label.toUpperCase()}; // Align severity levels for CloudWatch
            }
        },
        messageKey: "message",
        redact: {
            paths: config.logRedactPaths,
            remove: true,
        },
        ignoreFunc: (_options, request) =>
            request.path.startsWith("/assets"),
        debug: config.isDev,
        logRequestStart: config.isDev,
        logRequestComplete: config.isDev,
    },
};

