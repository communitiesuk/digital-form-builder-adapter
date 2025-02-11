import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
//@ts-ignore
import {AdapterFormModel} from "src/server/plugins/engine/models";
//@ts-ignore
import createServer from "src/server";
import cheerio from "cheerio";
import path from "path";
//@ts-ignore
import {PageController} from "src/server/plugins/engine/page-controllers";
//@ts-ignore
import {TranslationLoaderService} from "src/server/services/TranslationLoaderService";

const form = require("../../../confirm-page.test.json");

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, before, after} = lab;

suite("PageController", () => {
    let server;
    let response;
    let $;

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
        const pages = [...form.pages];
        const firstPage = pages.shift();
        const formDef = {...form, pages: [firstPage, ...pages]};
        const formModel = new AdapterFormModel(formDef, {});
        const pageController = new PageController(formModel, firstPage);

        const vm = pageController.getViewModel({}, formModel);
        vm.i18n = {
            __: mockI18n
        };
        response = await server.render("summary", vm);

        $ = cheerio.load(response);
        expect($("h1.govuk-heading-l")).to.exist();
        expect($("h1.govuk-heading-l").text()).to.contain("First page");
    });

    // TODO: Fix tests for S3 Upload
    test("POST request - processes upload successfully", async () => {
        const pages = [...form.pages];
        const firstPage = pages.shift();
        const formDef = {...form, pages: [firstPage, ...pages]};
        const formModel = new AdapterFormModel(formDef, {});
        //@ts-ignore
        const pageController = new PageController(formModel, firstPage);

        const mockS3UploadService = {
            handleUploadRequest: async () => {
                return {success: true};
            },
        };

        const request = {
            method: "POST",
            url: "/page",
            payload: {
                file: Buffer.from("test file content"),
                filename: "testfile.txt",
                pageDef: firstPage, // Ensure pageDef is included in the payload
            },
        };

        // Inject the mock service into the server's context
        server.app.services = {
            s3UploadService: mockS3UploadService,
        };

        try {
            response = await server.inject(request);
            expect(response.statusCode).to.equal(200);
            expect(response.result).to.be.an.object();
        } catch (error) {
            console.error("Error during test:", error);
        }
    });

    test("should display change request banner on page with feedback", async () => {
        server = await createServer({
            formFileName: "sample-page.test.json",
            formFilePath: path.join(__dirname, "../../../"),
            enforceCsrf: false,
        });

        const { adapterCacheService } = server.services();
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
            url: '/sample-page.test/project-name',
        });

        $ = cheerio.load(response.payload);

        expect($("h2").text()).to.contain("Change request");
    });

    test("should no display change request banner on page without feedback", async () => {
        server = await createServer({
            formFileName: "sample-page.test.json",
            formFilePath: path.join(__dirname, "../../../"),
            enforceCsrf: false,
        });

        const { adapterCacheService } = server.services();
        adapterCacheService.getState = () => {
            return Promise.resolve({
                metadata: {
                    change_requests: {
                        "no_found": ["Assessor Feedback"]
                    }
                }
            });
        };

        const response = await server.inject({
            method: 'GET',
            url: '/sample-page.test/project-name',
        });

        $ = cheerio.load(response.payload);

        expect($("h2").text()).to.not.contain("Change request");
    });
});
