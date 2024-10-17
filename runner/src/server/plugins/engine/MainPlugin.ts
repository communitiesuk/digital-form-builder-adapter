import path from "path";
import {configure} from "nunjucks";
import {AdapterFormModel} from "./models";
import {Options} from "./types/PluginOptions";
import {HapiServer} from "../../types";
import {RegisterFormPublishApi} from "./api";
import fs from "fs";
import Boom from "boom";


configure([
    // Configure Nunjucks to allow rendering of content that is revealed conditionally.
    path.resolve(__dirname, "/views"),
    path.resolve(__dirname, "/views/partials"),
    "node_modules/govuk-frontend/govuk/",
    "node_modules/govuk-frontend/govuk/components/",
    "node_modules/@xgovformbuilder/designer/views",
    "node_modules/hmpo-components/components"
]);


export const plugin = {
    name: "@communitiesuk/runner/engine",
    dependencies: "@hapi/vision",
    multiple: true,
    register: (server: HapiServer, options: Options) => {
        const {modelOptions, configs} = options;
        // @ts-ignore
        server.app.forms = {};
        // @ts-ignore
        const forms = server.app.forms;

        // translations that needs for the component level
        let translationEn = undefined
        let translationCy = undefined
        try {
            const filePathCy = path.join(__dirname, '../../../locales', `cy.json`);
            const filePathEn = path.join(__dirname, '../../../locales', `en.json`);
            // @ts-ignore
            const dataCy = fs.readFileSync(filePathCy, 'utf8');
            const dataEn = fs.readFileSync(filePathEn, 'utf8');
            translationEn = JSON.parse(dataEn);
            translationCy = JSON.parse(dataCy);
        } catch (err) {
            console.error(`Error reading translations`, err);
            Boom.internal("Cannot read translations from the local folder")
        }

        configs.forEach((config) => {
            forms[config.id] = new AdapterFormModel(config.configuration, {
                ...modelOptions,
                basePath: config.id,
                translationEn: translationEn,
                translationCy: translationCy
            });
        });
        options.forms = forms;
        new RegisterFormPublishApi().register(server, options);
    }
};
