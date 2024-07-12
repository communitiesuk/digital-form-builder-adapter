import fs from "fs";
import path from "path";

import { idFromFilename } from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/helpers";
import { FormConfiguration } from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/services/configurationService";

const FORMS_FOLDER = path.join(__dirname, "..", "..", "..", "forms");

/**
 * Reads the runner/src/server/forms directory for JSON files. The forms that are found will be loaded up at localhost:3009/id
 */
export const loadForms = (): FormConfiguration[] => {
    const configFiles = fs
        .readdirSync(FORMS_FOLDER)
        .filter((filename: string) => filename.indexOf(".json") >= 0);

    return configFiles.map((configFile) => {
        const dataFilePath = path.join(FORMS_FOLDER, configFile);
        const configuration = require(dataFilePath);
        const id = idFromFilename(configFile);
        return { configuration, id };
    });
};

