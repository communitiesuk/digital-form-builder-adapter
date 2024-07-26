import pluginLogging from "../../../../digital-form-builder/runner/src/server/plugins/logging";

pluginLogging.options.ignoreFunc = (_options, request) => request.path.startsWith("/assets")
export const pluginLog: any = pluginLogging
