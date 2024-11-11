import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import * as path from "path";
//@ts-ignore
import {AdapterFormModel} from "src/server/plugins/engine/models";
//@ts-ignore
import createServer from "src/server";
import cheerio from "cheerio";
//@ts-ignore
import {ConfirmPageController} from "src/server/plugins/engine/page-controllers";
//@ts-ignore
import {TranslationLoaderService} from "src/server/services/TranslationLoaderService";

// @ts-ignore
import form from "../../../confirm-page.test.json";
import sinon from 'sinon';
import {AdapterCacheService} from "../../../../../../src/server/services";

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, before, after} = lab;

suite("ConfirmPageController", () => {
    let server;
    let adapterCacheService;
    let $;

    before(async () => {
        server = await createServer({
            formFileName: "confirm-page.test.json",
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

    test("shouldDisplayConfirmContinueButtonWithLabelOnPageView_whenConfirmPageControllerIsLoaded", async () => {

        // Define the mock state with metadata
        const mockState = {
            metadata: {
                has_eligibility: true
            }
            // Add any other necessary metadata here
        };
        // Stub getState to return the mock state
        adapterCacheService.getState.resolves(mockState);

        const response = await server.inject({
            method: 'GET',
            url: '/confirm-page.test/summary'
        });

        $ = cheerio.load(response);
        expect($(".button .dialog-button .modal-dialog__inner__button .js-dialog-close")).to.exist();
        expect($(".button .dialog-button .modal-dialog__inner__button .js-dialog-close").text()).to.contain("Continue application");
    });

    test("shouldRedirectsToEligibilityResultUrlInPost_whenConfirmPageControllerIsLoaded", async () => {
        const pages = [...form.pages];
        const firstPage = pages.shift();
        const formDef = {...form, pages: [firstPage, ...pages]};
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
