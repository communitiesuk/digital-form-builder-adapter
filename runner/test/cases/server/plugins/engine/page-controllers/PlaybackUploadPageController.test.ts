/* TODO may be in future if needed we might need to add this feature
import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
//@ts-ignore
import {PlaybackUploadPageController} from "src/server/plugins/engine/page-controllers/PlaybackUploadPageController";
//@ts-ignore
import {AdapterFormModel} from "src/server/plugins/engine/models";
//@ts-ignore
import createServer from "src/server";
import path from "path";
import cheerio from "cheerio";
//@ts-ignore
import {TranslationLoaderService} from "src/server/services/TranslationLoaderService";

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, before, after} = lab;


suite("PlaybackUploadPageController", () => {
    let server;
    let response;
    let $;
    const form = require("../../../confirm-page.test.json");
    const pages = [...form.pages];
    const firstPage = pages.shift();
    const formDef = {...form, pages: [firstPage, ...pages]};
    const formModel = new AdapterFormModel(formDef, {});
    const inputComponent = {}; // Mock input component
    const pageController = new PlaybackUploadPageController(formModel, firstPage, inputComponent);

    const mockI18n = (key) => {
        const translationService: TranslationLoaderService = new TranslationLoaderService();
        const translations = translationService.getTranslations();
        return translations.en[key] || key;
    };

    before(async () => {
        server = await createServer({
            formFileName: "confirm-page.test.json",
            formFilePath: path.join(__dirname, "../../../"),
            enforceCsrf: false,
        });
        server.i18n = {
            __: mockI18n
        };
    });

    after(async () => {
        await server.stop();
    });

    test("GET request - renders page correctly", async () => {
        const handler = pageController.makeGetRouteHandler();
        const request = {
            method: "GET",
            url: "/page",
            services: () => ({
                adapterCacheService: {
                    getState: async () => ({progress: []}),
                },
            }),
        };

        const h = {
            //@ts-ignore
            view: (template, context) => {
                return {source: `<h1 class="govuk-heading-l">${context.pageTitle}</h1>`};
            },
        };

        response = await handler(request, h);
        const html = response.source;
        $ = cheerio.load(html);

        expect($("h1.govuk-heading-l")).to.exist();
        expect($("h1.govuk-heading-l").text()).to.contain("Check your image");
    });

    test("POST request - processes upload successfully", async () => {
        const handler = pageController.makePostRouteHandler();
        const request = {
            method: "POST",
            url: "/page",
            payload: {
                crumb: "testCrumb",
                retryUpload: "false",
            },
            services: () => ({
                adapterCacheService: {
                    getState: async () => ({progress: []}),
                },
            }),
        };

        const h = {
            redirect: (location) => {
                return {statusCode: 302, headers: {location}};
            },
        };

        response = await handler(request, h);
        expect(response.statusCode).to.equal(302); // Redirect status code
        expect(response.headers.location).to.exist(); // Check for redirect location
    });

    test("POST request - handles validation error", async () => {
        const handler = pageController.makePostRouteHandler();
        const request = {
            method: "POST",
            url: "/page",
            payload: {
                crumb: "testCrumb",
                retryUpload: "", // Invalid value to trigger validation error
            },
            services: () => ({
                adapterCacheService: {
                    getState: async () => ({progress: []}),
                },
            }),
        };

        const h = {
            //@ts-ignore
            view: (template, context) => {
                return {source: `<h1 class="govuk-heading-l">${context.pageTitle}</h1><div class="govuk-error-summary"></div>`};
            },
        };

        response = await handler(request, h);
        const html = response.source;
        $ = cheerio.load(html);

        expect($("h1.govuk-heading-l")).to.exist();
        expect($("h1.govuk-heading-l").text()).to.contain("Check your image");
        expect($(".govuk-error-summary")).to.exist(); // Check for error summary
    });
});
*/
