import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import * as path from "path";
//@ts-ignore
import createServer from "src/server";
const cheerio = require("cheerio");
//@ts-ignore
import {config} from "../../../../../../src/server/plugins/utils/AdapterConfigurationSchema";

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, before, after} = lab;

suite("ContinuePageController", () => {
    let server;
    let $;

    before(async () => {
        config.jwtAuthEnabled = false;
        server = await createServer({
            formFileName: "continue-page.test.json",
            formFilePath: path.join(__dirname, "../../../"),
            enforceCsrf: false,
        });
    });

    after(async () => {
        await server.stop();
    });

    test("should display continue button with label on page view when continue page controller is loaded", async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/continue-page.test/are-you-applying-from-a-local-authority-in-england'
        });
        $ = cheerio.load(response.payload);
        expect($(".govuk-main-wrapper .govuk-button")).to.exist();
        expect($(".govuk-main-wrapper .govuk-button").text()).to.contain("Continue");
    });
});
