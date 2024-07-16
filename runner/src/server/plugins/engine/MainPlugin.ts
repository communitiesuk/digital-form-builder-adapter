import path from "path";
import {configure} from "nunjucks";
import {AdapterFormModel} from "./models/AdapterFormModel";
import {Options} from "./types/PluginOptions";
import {HapiServer} from "../../types";
import {RegisterFormPublishApi} from "./api/RegisterFormPublishApi";

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
        configs.forEach((config) => {
            forms[config.id] = new AdapterFormModel(config.configuration, {
                ...modelOptions,
                basePath: config.id
            });
        });
        options.forms = forms;
        new RegisterFormPublishApi().register(server, options);
    }
};
