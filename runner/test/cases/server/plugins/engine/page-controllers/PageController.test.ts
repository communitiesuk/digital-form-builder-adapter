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
        const { adapterCacheService } = server.services();
        adapterCacheService.getState = () => {
            return Promise.resolve({
                metadata: {
                    "any": "metadata"
                },
                callback: {
                    "any": "callback"
                }
            });
        };

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
                },
                callback: {
                    "any": "callback"
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
                },
                callback: {
                    "any": "callback"
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

    test("should display not change needed tag on page without feedback", async () => {
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
                    },
                    is_resubmission: true
                },
                callback: {
                    "any": "callback"
                }
            });
        };

        const response = await server.inject({
            method: 'GET',
            url: '/sample-page.test/project-name',
        });

        $ = cheerio.load(response.payload);

        expect($("#form-page-title-tag").text()).to.contain("No change needed");
    });

    test("should not display not change needed tag on page with feedback", async () => {
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
                    },
                    is_resubmission: true
                },
                callback: {
                    "any": "callback"
                }
            });
        };

        const response = await server.inject({
            method: 'GET',
            url: '/sample-page.test/project-name',
        });

        $ = cheerio.load(response.payload);

        expect($("#form-page-title-tag").length).to.equal(0);
    });

    test("should not display not change needed tag on first submission", async () => {
        server = await createServer({
            formFileName: "sample-page.test.json",
            formFilePath: path.join(__dirname, "../../../"),
            enforceCsrf: false,
        });

        const { adapterCacheService } = server.services();
        adapterCacheService.getState = () => {
            return Promise.resolve({
                metadata: {
                    change_requests: {},
                    is_resubmission: false
                },
                callback: {
                    "any": "callback"
                }
            });
        };

        const response = await server.inject({
            method: 'GET',
            url: '/sample-page.test/project-name',
        });

        $ = cheerio.load(response.payload);

        expect($("#form-page-title-tag").length).to.equal(0);
    });
});
