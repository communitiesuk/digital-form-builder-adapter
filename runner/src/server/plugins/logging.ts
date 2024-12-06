import pluginLogging from "../../../../digital-form-builder/runner/src/server/plugins/logging";
import {config} from "./utils/AdapterConfigurationSchema";

pluginLogging.options.ignoreFunc = (_options, request) => request.path.startsWith("/assets")
pluginLogging.options.redact = {
    paths: config.logRedactPaths,
    //@ts-ignore
    remove: true,
}
export const pluginLog: any = pluginLogging
