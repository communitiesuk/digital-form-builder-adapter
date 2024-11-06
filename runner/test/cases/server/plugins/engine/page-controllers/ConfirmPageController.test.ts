import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import * as path from "path";

import { AdapterFormModel } from "src/server/plugins/engine/models";
import createServer from "src/server";
import cheerio from "cheerio";
import { ConfirmPageController } from "src/server/plugins/engine/page-controllers";
const form = require("../../../confirm-page.test.json");

const { expect } = Code;
const lab = Lab.script();
exports.lab = lab;
const { suite, test, before, after } = lab;

suite("ConfirmPageController", () => {
  let server;
  let response;
  let $;

  before(async () => {
    server = await createServer({
      formFileName: "confirm-page.test.json",
      formFilePath: path.join(__dirname, "../../../"),
      enforceCsrf: false,
    });
  });

  after(async () => {
    await server.stop();
  });

  test("renders confirm and continue button", async () => {
    const pages = [...form.pages];
    const firstPage = pages.shift();
    const formDef = { ...form, pages: [firstPage, ...pages] };
    let formModel = new AdapterFormModel(formDef, {});
    const pageController = new ConfirmPageController(formModel, firstPage);
    const vm = pageController.getViewModel({}, formModel);
    response = await server.render("summary", vm);

    $ = cheerio.load(response);
    expect($(".govuk-main-wrapper .govuk-button")).to.exist();
    expect($(".govuk-main-wrapper .govuk-button").text()).to.contain("Save and continue");
  });

  test("redirects to eligibility result URL on post", async () => {
    const pages = [...form.pages];
    const firstPage = pages.shift();
    const formDef = { ...form, pages: [firstPage, ...pages] };
    let formModel = new AdapterFormModel(formDef, {});
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
      redirect: (url) => url,
    };

    const redirectUrl = await handler(request, h);
    expect(redirectUrl).to.equal("/test-fund/test-round?form_session_identifier=test-session");
  });
});
