import path from "path";
import {plugin} from "./engine/MainPlugin";

import {idFromFilename} from "../../../../digital-form-builder/runner/src/server/plugins/engine/helpers";
import {
    FormConfiguration
} from "../../../../../digital-form-builder/runner/src/server/plugins/engine/services/configurationService";

import {EngineOptions} from "./engine/types/EngineOptions";
import {ConfigureEnginePluginType} from "./engine/types/ConfigureEnginePluginType";

const relativeTo = __dirname;

export const ConfigureFormsPlugin: ConfigureEnginePluginType = (
    formFileName, formFilePath, options?: EngineOptions) => {
    let configs: FormConfiguration[] = [];

    if (formFileName && formFilePath) {
        configs = [
            {
                configuration: require(path.join(formFilePath, formFileName)),
                id: idFromFilename(formFileName)
            }
        ];
    }

    const modelOptions = {
        relativeTo
    };

    return {
        plugin,
        options: {modelOptions, configs}
    };
};
