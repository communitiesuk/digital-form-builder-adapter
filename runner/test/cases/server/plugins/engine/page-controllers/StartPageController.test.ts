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

const form = require("../../../confirm-page.test.json");

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, before, after, beforeEach, afterEach} = lab;

suite("StartPageController", () => {
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

    test("renders start page with form components", async () => {
        const pages = [...form.pages];
        const firstPage = pages.shift();
        const formDef = {...form, pages: [firstPage, ...pages]};
        let formModel = new AdapterFormModel(formDef, {});
        const pageController = new StartPageController(formModel, firstPage);
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

    test("getViewModel includes isStartPage and skipTimeoutWarning", async () => {
        const pages = [...form.pages];
        const firstPage = pages.shift();
        const formDef = {...form, pages: [firstPage, ...pages]};
        let formModel = new AdapterFormModel(formDef, {});
        const pageController = new StartPageController(formModel, firstPage);

        const formData = {};
        const errors = {};
        const viewModel = pageController.getViewModel(formData, errors);

        expect(viewModel.isStartPage).to.be.true();
        expect(viewModel.skipTimeoutWarning).to.be.true();
    });
});
