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
import nunjucks from "nunjucks";
import cheerio from "cheerio";
import _path = require("path");
import resolve from "resolve";

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, before, beforeEach} = lab;

//@ts-ignore mock the render functionality
function i18nGetTranslation(key, lang) {
    const translationService: TranslationLoaderService = new TranslationLoaderService();
    const translations = translationService.getTranslations();
    return key.split('.').reduce((acc, key) => acc && acc[key], translations.en);
}

const basedir = _path.join(process.cwd(), "..");
const xGovFormsPath = _path.resolve(__dirname, "../../../../../.../../../");
const mockNunjucks = nunjucks.configure([
    `${_path.join(__dirname, "../../../../../../src/server", "views")}`,
    `${_path.join(__dirname, "../../../../../../src/server", "engine", "views")}`,
    `${_path.join(xGovFormsPath, "digital-form-builder/runner/src/server/views")}`,
    `${_path.join(xGovFormsPath, "digital-form-builder/runner/src/server/plugins/engine/views/components")}`,
    `${_path.join(xGovFormsPath, "digital-form-builder/runner/src/server/plugins/engine/views/partials")}`,
    `${_path.dirname(resolve.sync("govuk-frontend", {basedir}))}`,
    `${_path.dirname(resolve.sync("govuk-frontend", {basedir}))}/components`,
    `${_path.dirname(resolve.sync("hmpo-components"))}/components`,
], {autoescape: true});
// Add the mock translation function to the Nunjucks environment
mockNunjucks.addGlobal('i18nGetTranslation', i18nGetTranslation);


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

    test("shouldDisplayConfirmContinueButtonWithLabelOnPageView_whenConfirmPageControllerIsLoaded", async () => {
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
                // Render the template with Nunjucks
                return mockNunjucks.render(`${_templateName}.html`, contextData);
            }),
        };
        const response = await page.makeGetRouteHandler()(request, h);
        $ = cheerio.load(response);
        expect($(".govuk-button")).to.exist();
        expect($(".govuk-button").text()).to.contain("Confirm and continue");
    });

    test("shouldRedirectsToEligibilityResultUrlInPost_whenConfirmPageControllerIsLoaded", async () => {
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
