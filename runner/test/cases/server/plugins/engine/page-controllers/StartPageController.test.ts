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
import {StartPageController} from "src/server/plugins/engine/page-controllers";
//@ts-ignore
import {TranslationLoaderService} from "src/server/services/TranslationLoaderService";

const form = require("../../../start-page.test.json");

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, before, after, beforeEach, afterEach} = lab;

suite("StartPageController", () => {
    let server;
    let $;
    let sandbox;
    let adapterCacheService;
    let options = {};

    before(async () => {
        server = await createServer({
            formFileName: "start-page.test.json",
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
    });

    afterEach(() => {
        sandbox.restore();
        sinon.restore();
    });

    test("renders start page with form components", async () => {
        // Define the mock state with metadata
        const mockState = {
            metadata: {}
            // Add any other necessary metadata here
        };
        // Stub getState to return the mock state
        adapterCacheService.getState.resolves(mockState);

        const response = await server.inject({
            method: 'GET',
            url: '/start-page.test/before-you-start'
        });

        $ = cheerio.load(response.payload);
        expect($(".govuk-main-wrapper form")).to.exist();
        expect($(".govuk-button")).to.exist();
        expect($(".govuk-button").text()).to.contain("Continue");
    });

    test("getViewModel includes isStartPage and skipTimeoutWarning", async () => {
        const pages = [...form.pages];
        const firstPage = pages.shift();
        const formDef = {...form, pages: [firstPage, ...pages]};
        let formModel = new AdapterFormModel(formDef, options);
        const pageController = new StartPageController(formModel, firstPage);

        const formData = {};
        const errors = {};
        const viewModel = pageController.getViewModel(formData, errors);

        expect(viewModel.isStartPage).to.be.true();
        expect(viewModel.skipTimeoutWarning).to.be.true();
    });

    test("start page show change request message", async () => {
        const {adapterCacheService} = server.services();
        adapterCacheService.getState = () => {
            return Promise.resolve({
                metadata: {
                    change_requests: {
                        "VcyKVN": ["Assessor Feedback"]
                    }
                }
            });
        };

        const response = await server.inject({
            method: 'GET',
            url: '/start-page.test/before-you-start',
        });

        $ = cheerio.load(response.payload);
        expect($(".govuk-heading-m").text()).to.contain("Change requested");
    });
});
