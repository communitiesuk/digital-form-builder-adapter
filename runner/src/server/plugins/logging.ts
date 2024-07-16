import config from "../../../../digital-form-builder/runner/src/server/config";
import pino from "hapi-pino";

export default {
  plugin: pino,
  options: {
    prettyPrint:
      config.logPrettyPrint === "true" || config.logPrettyPrint === true,
    level: config.logLevel,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    debug: config.isDev,
    logRequestStart: config.isDev,
    logRequestComplete: config.isDev,
    redact: {
      paths: config.logRedactPaths,
      censor: "REDACTED",
    },
  },
};
