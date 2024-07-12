import path from "path";
import { plugin } from "./engine/MainPlugin";

import {loadForms } from "./engine/service/ConfigurationFormsService";
import { idFromFilename } from "../../../../digital-form-builder/runner/src/server/plugins/engine/helpers";
import { FormConfiguration } from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/services/configurationService";
import config from "../../../../digital-form-builder/runner/src/server/config";

type ConfigureEnginePluginType = (
    formFileName?: string,
    formFilePath?: string
) => {
    plugin: any;
    options: {
        modelOptions: {
            relativeTo: string;
            previewMode: any;
        };
        configs: {
            configuration: any;
            id: string;
        }[];
        previewMode: boolean;
    };
};

const relativeTo = __dirname;

type EngineOptions = {
    previewMode?: boolean;
};

// @ts-ignore
export const ConfigureFormsPlugin: ConfigureEnginePluginType = (
    formFileName,
    formFilePath,
    options?: EngineOptions
) => {
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
        options: { modelOptions, configs, previewMode: config.previewMode }
    };
};
