import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import * as path from "path";

import { AdapterFormModel } from "src/server/plugins/engine/models";
import createServer from "src/server";
import cheerio from "cheerio";
import { ContinuePageController } from "src/server/plugins/engine/page-controllers";
const form = require("../../../continue-page.test.json");

const { expect } = Code;
const lab = Lab.script();
exports.lab = lab;
const { suite, test, before, after } = lab;

suite("ContinuePageController", () => {
  let server;
  let response;
  let $;

  before(async () => {
    server = await createServer({
      formFileName: "continue-page.test.json",
      formFilePath: path.join(__dirname, "../../../"),
      enforceCsrf: false,
    });
  });

  after(async () => {
    await server.stop();
  });

  test("renders continue button", async () => {
    const pages = [...form.pages];
    const firstPage = pages.shift();
    const formDef = { ...form, pages: [firstPage, ...pages] };
    let formModel = new AdapterFormModel(formDef, {});
    const pageController = new ContinuePageController(formModel, firstPage);
    const vm = pageController.getViewModel({}, formModel);
    response = await server.render("summary", vm);

    $ = cheerio.load(response);
    expect($(".govuk-main-wrapper .govuk-button")).to.exist();
    expect($(".govuk-main-wrapper .govuk-button").text()).to.contain("Save and continue");
  });
});
