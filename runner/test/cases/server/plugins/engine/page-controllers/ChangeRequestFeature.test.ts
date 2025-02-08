import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import * as path from "path";

//@ts-ignore
import createServer from "src/server";
import cheerio from "cheerio";

const {expect} = Code;
const lab = Lab.script();

exports.lab = lab;

const {suite, test, before, after} = lab;

suite("ChangeRequestFeature", () => {
    let server;
    let $;

    before(async () => {
        server = await createServer({
            formFileName: "sample-page.test.json",
            formFilePath: path.join(__dirname, "../../../"),
            enforceCsrf: false,
        });
    });

    after(async () => {
        await server.stop();
    });

    test("should display change request banner on page with feedback", async () => {     
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

    test("should display change request message on start page", async () => {     
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
            url: '/sample-page.test/project-details',
        });

        $ = cheerio.load(response.payload);

        expect($("h1").text()).to.contain("Change requested");
    });


    test("should not display change request message on start page", async () => {     
        const { adapterCacheService } = server.services();
        adapterCacheService.getState = () => {
            return Promise.resolve({
                metadata: {
                    change_requests: null
                }
            });
        };

        const response = await server.inject({
            method: 'GET',
            url: '/sample-page.test/project-details',
        });

        $ = cheerio.load(response.payload);

        expect($("h1").text()).to.not.contain("Change requested");
    });
});
