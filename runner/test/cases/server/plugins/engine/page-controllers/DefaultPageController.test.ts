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

const form = require("../../../confirm-page.test.json");

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, before, after, beforeEach, afterEach} = lab;

suite("DefaultPageController", () => {
    let server;
    let response;
    let $;
    let sandbox;

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

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    test("renders default page with form components", async () => {
        const pages = [...form.pages];
        const firstPage = pages.shift();
        const formDef = {...form, pages: [firstPage, ...pages]};
        let formModel = new AdapterFormModel(formDef, {});
        const pageController = new DefaultPageController(formModel, firstPage);
        const vm = pageController.getViewModel({}, formModel);
        vm.i18n = {
            __: mockI18n
        };
        response = await server.render("summary", vm);

        $ = cheerio.load(response);
        expect($(".govuk-main-wrapper form")).to.exist();
        expect($(".govuk-main-wrapper .govuk-button")).to.exist();
        expect($(".govuk-main-wrapper .govuk-button").text()).to.contain("Save and continue");
    });

    test("handles post request and proceeds to next page", async () => {
        const pages = [...form.pages];
        const firstPage = pages.shift();
        const formDef = {...form, pages: [firstPage, ...pages]};
        let formModel = new AdapterFormModel(formDef, {});
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
        };

        const h = {
            redirect: (url) => url,
        };

        const result = await handler(request, h);
        expect(result).to.equal('/next-page');
        expect(pageController.handlePostRequest.calledOnce).to.be.true();
        expect(pageController.proceed.calledOnce).to.be.true();
    });

    test("retrieves pages up to current", async () => {
        const pages = [...form.pages];
        const firstPage = pages.shift();
        const formDef = {...form, pages: [firstPage, ...pages]};
        let formModel = new AdapterFormModel(formDef, {});
        const pageController = new DefaultPageController(formModel, firstPage);

        // Create a simple mock model
        const mockStartPage = {
            path: '/start',
            hasFormComponents: true,
            getNextPage: sinon.stub().returns(null)
        };

        pageController.model.startPage = mockStartPage;
        pageController.path = '/start'; // Set the current page to be the start page

        const state = {};
        const result = pageController.retrievePagesUpToCurrent(state);

        // Check the structure of the result
        expect(result).to.be.an.object();
        expect(result.relevantPages).to.be.an.array();

        // Check if the start page is included
        expect(result.relevantPages).to.have.length(1);
        expect(result.relevantPages[0].path).to.equal('/start');

        // Check that the endPage is null
        expect(result.endPage).to.be.null();

        // Verify that getNextPage was not called
        expect(mockStartPage.getNextPage.called).to.be.false();
    });
});
