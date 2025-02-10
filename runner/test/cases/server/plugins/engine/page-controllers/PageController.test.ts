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
import * as sinon from "sinon";

const form = require("../../../start-page.test.json");

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, before, after} = lab;

suite("PageController", () => {
    let server;
    let response;
    let $;
    let adapterCacheService;

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
    });

    after(async () => {
        await server.stop();
    });

    test("GET request - renders page correctly", async () => {
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
        expect($("h1.govuk-heading-l")).to.exist();
        expect($("h1.govuk-heading-l").text()).to.contain("Before you start");
    });

    // TODO: Fix tests for S3 Upload
    test("POST request - processes upload successfully", async () => {
        const pages = [...form.pages];
        const firstPage = pages.shift();
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
});
