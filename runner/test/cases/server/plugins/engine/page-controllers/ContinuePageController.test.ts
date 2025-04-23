import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import * as path from "path";
//@ts-ignore
import createServer from "src/server";
import cheerio from "cheerio";
//@ts-ignore
import {config} from "../../../../../../src/server/plugins/utils/AdapterConfigurationSchema";
import * as sinon from "sinon";

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, before, after} = lab;

suite("ContinuePageController", () => {
    let server;
    let $;
    let adapterCacheService;

    before(async () => {
        config.jwtAuthEnabled = false;
        server = await createServer({
            formFileName: "continue-page.test.json",
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

    test("should display continue button with label on page view when continue page controller is loaded", async () => {
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
            url: '/continue-page.test/are-you-applying-from-a-local-authority-in-england'
        });
        $ = cheerio.load(response.payload);
        expect($(".govuk-main-wrapper .govuk-button")).to.exist();
        expect($(".govuk-main-wrapper .govuk-button").text()).to.contain("Continue");
    });
});
