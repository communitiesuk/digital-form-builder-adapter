import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
//@ts-ignore
import {AdapterFormModel} from "src/server/plugins/engine/models";
//@ts-ignore
import createServer from "src/server";
//@ts-ignore
import {ConfirmPageController} from "src/server/plugins/engine/page-controllers";
//@ts-ignore
import {TranslationLoaderService} from "src/server/services/TranslationLoaderService";

// @ts-ignore
import form from "../../../confirm-page.test.json";
import sinon from 'sinon';
//@ts-ignore
import adapterCacheService from "../../../../../../src/server/services";
import {PluginUtil} from "../../../../../../src/server/plugins/engine/util/PluginUtil";
import cheerio from "cheerio";
import mockView from "./shared/mockView";

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, before, beforeEach} = lab;

suite("ConfirmPageController", () => {
    let $;
    let options = {};

    before(async () => {
        const translationService: TranslationLoaderService = new TranslationLoaderService();
        const translations = translationService.getTranslations();
        options = {
            translationEn: translations.en,
            translationCy: translations.cy
        };
    });

    beforeEach(() => {
        sinon.restore(); // Reset any existing stubs
    });

    test("should display confirm continue button with label on page view when confirm page controller is loaded", async () => {
        const pages = [...form.pages];
        const firstPage = pages.shift();
        const formDef = {...form, pages: [firstPage, ...pages]};
        let formModel = new AdapterFormModel(formDef, options);
        const page = formModel.pages.find(
            (page) => PluginUtil.normalisePath(page.path) === PluginUtil.normalisePath("summary")
        );

        const mockState = {
            progress: ["/confirm-page.test/are-you-applying-from-a-local-authority-in-england"],
            "mwumLN": {
                "lHTLBl": true
            },
            metadata: {
                has_eligibility: true,
            }
        };
        // Mock adapterCacheService with the methods you need
        const mockAdapterCacheService: any = {
            getState: sinon.stub().resolves(mockState),
        };
        // Mock request with state
        const request = {
            services: sinon.stub().returns({
                adapterCacheService: mockAdapterCacheService,
            }),
            query: {
                lang: "en"
            },
            yar: {
                get: sinon.stub().returns("en"),
                flash: sinon.stub().returns("en")
            },
            logger: {
                info: sinon.stub().returns("logger")
            },
            i18n: {
                __: sinon.stub().returns("english text"),
                getLocale: sinon.stub().returns("en")
            },
            auth: {
                isAuthenticated: false
            }
        };

        // Mock Hapi response toolkit
        const h = {
            response: sinon.stub().returns({
                code: sinon.stub()
            }),
            redirect: sinon.stub(),
            view: sinon.stub().callsFake(async (_templateName, contextData) => {
                // Call server.render with the same arguments
                expect(contextData.page).exist();
                expect(contextData.page.isEligibility).to.be.true;
                //Render the template with Nunjucks
                return mockView.render(`${_templateName}.html`, contextData);
            }),
        };
        const response = await page.makeGetRouteHandler()(request, h);
        $ = cheerio.load(response);
        expect($(".govuk-button")).to.exist();
        expect($(".govuk-button").text()).to.contain("Confirm and continue");
    });

    test("should redirects to eligibility result url in post when confirm page controller is loaded", async () => {
        const pages = [...form.pages];
        const firstPage = pages.shift();
        const formDef = {...form, pages: [firstPage, ...pages]};
        let formModel = new AdapterFormModel(formDef, options);
        const pageController = new ConfirmPageController(formModel, firstPage);
        const handler = pageController.makePostRouteHandler();
        const request = {
            query: {
                form_session_identifier: "test-session",
            },
            services: () => ({
                adapterCacheService: {
                    getState: async () => ({
                        metadata: {
                            fund_name: "test-fund",
                            round_name: "test-round",
                        },
                    }),
                },
            }),
        };
        const h = {
            redirect: (url) => {
                return url;
            },
        };
        const stubbedURL = sinon.stub().returns({
            href: "/test-fund/test-round", // Mock the URL href property
            searchParams: {
                set: sinon.stub(), // Mock searchParams.set method (if needed)
            },
        });
        global.URL = stubbedURL;
        const redirectUrl = await handler(request, h);
        expect(redirectUrl).to.equal("/test-fund/test-round?form_session_identifier=test-session");
    });
});
