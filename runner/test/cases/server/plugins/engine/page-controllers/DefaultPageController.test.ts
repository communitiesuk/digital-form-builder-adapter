import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import * as path from "path";
import * as sinon from "sinon";
//@ts-ignore
import {AdapterFormModel} from "src/server/plugins/engine/models";
//@ts-ignore
import createServer from "src/server";
import cheerio from "cheerio";
//@ts-ignore
import {DefaultPageController} from "src/server/plugins/engine/page-controllers";
//@ts-ignore
import {TranslationLoaderService} from "src/server/services/TranslationLoaderService";
import config from "../../../../../../../digital-form-builder/runner/src/server/config";

import form from "../../../declarations.json";

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, before, after, beforeEach, afterEach} = lab;

suite("DefaultPageController", () => {
    let server;
    let $;
    let sandbox;
    let adapterCacheService;
    let options = {};

    before(async () => {
        server = await createServer({
            formFileName: "declarations.json",
            formFilePath: path.join(__dirname, "../../../"),
            enforceCsrf: false,
        });
        // Create a mock of adapterCacheService
        adapterCacheService = {
            getState: sinon.stub()
        };
        const translationService: TranslationLoaderService = new TranslationLoaderService();
        const translations = translationService.getTranslations();
        options = {
            translationEn: translations.en,
            translationCy: translations.cy
        };
    });

    after(async () => {
        await server.stop();
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(config, 'eligibilityResultUrl').value('https://mocked-url.com');
    });

    afterEach(() => {
        sandbox.restore();
    });

    test("renders default page with form components", async () => {
        // Define the mock state with metadata
        const mockState = {
            metadata: {}
            // Add any other necessary metadata here
        };
        // Stub getState to return the mock state
        adapterCacheService.getState.resolves(mockState);

        const response = await server.inject({
            method: 'GET',
            url: `/declarations/agree-to-the-final-confirmations-DWyips`
        });

        $ = cheerio.load(response.payload);
        expect($(".govuk-main-wrapper form")).to.exist();
        expect($(".govuk-main-wrapper .govuk-button")).to.exist();
        expect($(".govuk-main-wrapper .govuk-button").text()).to.contain("Save and continue");
    });

    test("handles post request and proceeds to next page", async () => {
        const pages = [...form.pages];
        const firstPage = pages.shift();
        const formDef = {...form, pages: [firstPage, ...pages]};
        let formModel = new AdapterFormModel(formDef, options);
        const pageController = new DefaultPageController(formModel, firstPage);

        // Mock handlePostRequest to return a response without errors
        sandbox.stub(pageController, 'handlePostRequest').resolves({source: {context: {}}});

        // Mock proceed method
        sandbox.stub(pageController, 'proceed').resolves('/next-page');

        const handler = pageController.makePostRouteHandler();

        const request = {
            query: {},
            payload: {},
            services: () => ({
                adapterCacheService: {
                    getState: async () => ({}),
                    mergeState: async () => {
                    },
                },
                adapterStatusService: {
                    outputRequests: async () => {
                    },
                },
            }),
            logger: {
                info: sinon.stub().returns("logger"),
                error: sinon.stub().returns("logger")
            },
        };

        const h = {
            redirect: (url) => url,
        };

        const result = await handler(request, h);
        expect(result).to.equal('/next-page');
        expect(pageController.handlePostRequest.calledOnce).to.be.true();
        expect(pageController.proceed.calledOnce).to.be.true();
    });
});
