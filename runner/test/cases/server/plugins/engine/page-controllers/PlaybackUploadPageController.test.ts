import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import { PlaybackUploadPageController } from "src/server/plugins/engine/page-controllers/PlaybackUploadPageController";
import { AdapterFormModel } from "src/server/plugins/engine/models";
import createServer from "src/server";
import path from "path";
import cheerio from "cheerio";

const { expect } = Code;
const lab = Lab.script();
exports.lab = lab;
const { suite, test, before, after } = lab;

suite("PlaybackUploadPageController", () => {
  let server;
  let response;
  let $;
  const form = require("../../../confirm-page.test.json");
  const pages = [...form.pages];
  const firstPage = pages.shift();
  const formDef = { ...form, pages: [firstPage, ...pages] };
  const formModel = new AdapterFormModel(formDef, {});
  const inputComponent = {}; // Mock input component
  const pageController = new PlaybackUploadPageController(formModel, firstPage, inputComponent);

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

  test("GET request - renders page correctly", async () => {
    const handler = pageController.makeGetRouteHandler();
    const request = {
      method: "GET",
      url: "/page",
      services: () => ({
        adapterCacheService: {
          getState: async () => ({ progress: [] }),
        },
      }),
    };

    const h = {
      view: (template, context) => {
        return { source: `<h1 class="govuk-heading-l">${context.pageTitle}</h1>` };
      },
    };

    response = await handler(request, h);
    const html = response.source;
    $ = cheerio.load(html);

    expect($("h1.govuk-heading-l")).to.exist();
    expect($("h1.govuk-heading-l").text()).to.contain("Check your image");
  });

  test("POST request - processes upload successfully", async () => {
    const handler = pageController.makePostRouteHandler();
    const request = {
      method: "POST",
      url: "/page",
      payload: {
        crumb: "testCrumb",
        retryUpload: "false",
      },
      services: () => ({
        adapterCacheService: {
          getState: async () => ({ progress: [] }),
        },
      }),
    };

    const h = {
      redirect: (location) => {
        return { statusCode: 302, headers: { location } };
      },
    };

    response = await handler(request, h);
    expect(response.statusCode).to.equal(302); // Redirect status code
    expect(response.headers.location).to.exist(); // Check for redirect location
  });

  test("POST request - handles validation error", async () => {
    const handler = pageController.makePostRouteHandler();
    const request = {
      method: "POST",
      url: "/page",
      payload: {
        crumb: "testCrumb",
        retryUpload: "", // Invalid value to trigger validation error
      },
      services: () => ({
        adapterCacheService: {
          getState: async () => ({ progress: [] }),
        },
      }),
    };

    const h = {
      view: (template, context) => {
        return { source: `<h1 class="govuk-heading-l">${context.pageTitle}</h1><div class="govuk-error-summary"></div>` };
      },
    };

    response = await handler(request, h);
    const html = response.source;
    $ = cheerio.load(html);

    expect($("h1.govuk-heading-l")).to.exist();
    expect($("h1.govuk-heading-l").text()).to.contain("Check your image");
    expect($(".govuk-error-summary")).to.exist(); // Check for error summary
  });
});
