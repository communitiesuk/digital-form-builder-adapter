import _path = require("path");
import resolve from "resolve";
import nunjucks from "nunjucks";
import {TranslationLoaderService} from "../../../../../../../src/server/services/TranslationLoaderService";

// @ts-ignore Mock translation function
const i18nGetTranslation = (key, lang) => {
    const translationService: TranslationLoaderService = new TranslationLoaderService();
    const translations = translationService.getTranslations();
    return key.split('.').reduce((acc, key) => acc && acc[key], translations.en);
};

// Singleton instance
let mockView: nunjucks.Environment = null;

const basedir = _path.join(process.cwd(), "..");
const xGovFormsPath = _path.resolve(__dirname, "../../../../../.../../../../");

mockView = nunjucks.configure([
    `${_path.join(__dirname, "../../../../../../../src/server", "views")}`,
    `${_path.join(__dirname, "../../../../../../../src/server", "engine", "views")}`,
    `${_path.join(xGovFormsPath, "digital-form-builder/runner/src/server/views")}`,
    `${_path.join(xGovFormsPath, "digital-form-builder/runner/src/server/plugins/engine/views/components")}`,
    `${_path.join(xGovFormsPath, "digital-form-builder/runner/src/server/plugins/engine/views/partials")}`,
    `${_path.dirname(resolve.sync("govuk-frontend", {basedir}))}`,
    `${_path.dirname(resolve.sync("govuk-frontend", {basedir}))}/components`,
    `${_path.dirname(resolve.sync("hmpo-components"))}/components`,
], {autoescape: true});

// Add the mock translation function to the Nunjucks environment
mockView.addGlobal('i18nGetTranslation', i18nGetTranslation);


export default mockView;
