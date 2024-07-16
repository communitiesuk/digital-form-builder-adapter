import path from "path";
import {plugin} from "./engine/MainPlugin";

import {loadForms} from "./engine/service/ConfigurationFormsService";
import {idFromFilename} from "../../../../digital-form-builder/runner/src/server/plugins/engine/helpers";
import {
    FormConfiguration
} from "../../../../../digital-form-builder/runner/src/server/plugins/engine/services/configurationService";
import config from "../../../../digital-form-builder/runner/src/server/config";
import {EngineOptions} from "./engine/types/EngineOptions";
import {ConfigureEnginePluginType} from "./engine/types/ConfigureEnginePluginType";

const relativeTo = __dirname;

export const ConfigureFormsPlugin: ConfigureEnginePluginType = (
    formFileName, formFilePath, options?: EngineOptions) => {
    let configs: FormConfiguration[];

    if (formFileName && formFilePath) {
        configs = [
            {
                configuration: require(path.join(formFilePath, formFileName)),
                id: idFromFilename(formFileName)
            }
        ];
    } else {
        configs = loadForms();
    }

    const modelOptions = {
        relativeTo,
        previewMode: options?.previewMode ?? config.previewMode
    };

    return {
        plugin,
        options: {modelOptions, configs, previewMode: config.previewMode}
    };
};
