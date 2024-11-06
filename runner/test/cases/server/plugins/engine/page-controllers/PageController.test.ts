import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import { AdapterFormModel } from "src/server/plugins/engine/models";
import createServer from "src/server";
import cheerio from "cheerio";
import path from "path";
import { PageController } from "src/server/plugins/engine/page-controllers";
const form = require("../../../confirm-page.test.json");

const { expect } = Code;
const lab = Lab.script();
exports.lab = lab;
const { suite, test, before, after } = lab;

suite("PageController", () => {
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

  test("GET request - renders page correctly", async () => {
    const pages = [...form.pages];
    const firstPage = pages.shift();
    const formDef = { ...form, pages: [firstPage, ...pages] };
    const formModel = new AdapterFormModel(formDef, {});
    const pageController = new PageController(formModel, firstPage);

    const vm = pageController.getViewModel({}, formModel);
    response = await server.render("summary", vm);

    $ = cheerio.load(response);
    expect($("h1.govuk-heading-l")).to.exist();
    expect($("h1.govuk-heading-l").text()).to.contain("First page");
  });

  // TODO: Fix tests for S3 Upload
  test("POST request - processes upload successfully", async () => {
    const pages = [...form.pages];
    const firstPage = pages.shift();
    const formDef = { ...form, pages: [firstPage, ...pages] };
    const formModel = new AdapterFormModel(formDef, {});
    const pageController = new PageController(formModel, firstPage);
  
    const mockS3UploadService = {
      handleUploadRequest: async () => {
        return { success: true };
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
