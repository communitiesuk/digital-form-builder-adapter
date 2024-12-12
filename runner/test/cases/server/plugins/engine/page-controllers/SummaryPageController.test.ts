import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import * as path from "path";
import * as sinon from "sinon";
//@ts-ignore
import {AdapterFormModel} from "src/server/plugins/engine/models";
//@ts-ignore
import createServer from "src/server";
//@ts-ignore
import {StartPageController} from "src/server/plugins/engine/page-controllers";
//@ts-ignore
import {TranslationLoaderService} from "src/server/services/TranslationLoaderService";
import {PluginUtil} from "../../../../../../src/server/plugins/engine/util/PluginUtil";

import form from "../../../prefix-postfix-for-fields.test.json";

const {expect} = Code;
const lab = Lab.script();
exports.lab = lab;
const {suite, test, before, after, beforeEach, afterEach} = lab;

suite("SummaryPageController", () => {
    let server;
    let sandbox;

    const mockI18n = (key) => {
        const translationService: TranslationLoaderService = new TranslationLoaderService();
        const translations = translationService.getTranslations();
        return translations.en[key] || key;
    };

    before(async () => {
        server = await createServer({
            formFileName: "prefix-postfix-for-fields.test.json",
            formFilePath: path.join(__dirname, "../../../"),
            enforceCsrf: false,
        });
        server.i18n = {
            __: mockI18n
        };
    });

    after(async () => {
        await server.stop();
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    test("shouldAddingPreFixesForTheSummaryIfThereAreAnyPrefixes", async () => {
        const pages = [...form.pages];
        const firstPage = pages.shift();
        const formDef = {...form, pages: [firstPage, ...pages]};
        let formModel = new AdapterFormModel(formDef, {});
        const page = formModel.pages.find(
            (page) => PluginUtil.normalisePath(page.path) === PluginUtil.normalisePath("summary")
        );

        const mockState = {
            progress: ["/xwFi2C2S-Y/management-case-oqAeVI", "/xwFi2C2S-Y/management-case-kYpnwk"],
            FabDefault: {
                TzOokX: [{
                    GpLJDu: "Natalie Watkins",
                    RRzTlc: 148
                }, {
                    GpLJDu: "sdf",
                    RRzTlc: 4
                }],
                iyTJRX: 45,
                IdoZHN: 4343
            },
            webhookData: {
                metadata: {},
                name: "Apply for funding to save an asset in your community",
                questions: [{
                    category: "FabDefault",
                    question: "Management case",
                    fields: [{
                        key: "TzOokX",
                        title: "Sources of income",
                        type: "multiInput",
                        answer: [{
                            GpLJDu: "Natalie Watkins",
                            RRzTlc: 148
                        }, {
                            GpLJDu: "sdf",
                            RRzTlc: 4
                        }]
                    }, {
                        key: "iyTJRX",
                        title: "How many years old ",
                        type: "text",
                        answer: "45"
                    }, {
                        key: "IdoZHN",
                        title: "Amount your salary ?",
                        type: "text",
                        answer: "4343"
                    }]
                }]
            }
        };
        // Mock adapterCacheService with the methods you need
        const mockAdapterCacheService: any = {
            getState: sinon.stub().resolves(mockState),
        };
        // Mock request with state
        const request = {
            services: sinon.stub().returns({
                adapterCacheService: mockAdapterCacheService,
            }),
            query: {
                lang: "en"
            },
            yar: {
                get: sinon.stub().returns("en"),
                flash: sinon.stub().returns("en")
            },
            logger: {
                info: sinon.stub().returns("logger")
            },
            i18n: {
                __: sinon.stub().returns("english text"),
                getLocale: sinon.stub().returns("en")
            },
            auth: {
                isAuthenticated: false
            }
        };

        // Mock Hapi response toolkit
        const h = {
            response: sinon.stub().returns({
                code: sinon.stub()
            }),
            redirect: sinon.stub(),
            view: sinon.stub().callsFake(async (_templateName, contextData) => {
                // Call server.render with the same arguments
                expect(contextData.details).exist();
                expect(contextData.details[0]).exist();
                expect(contextData.details[0].items).exist();
                expect(contextData.details[0].items[0].value[0]).to.contains("Natalie Watkins : £148");
                expect(contextData.details[0].items[0].value[1]).to.contains("sdf : £4");
                expect(contextData.details[0].items[1].value).to.contains("45");
                expect(contextData.details[0].items[1].suffix).to.contains("years");
                expect(contextData.details[0].items[2].prefix).to.contains("£");
                expect(contextData.details[0].items[2].value).to.contains("4343");
            }),
        };
        await page.makeGetRouteHandler()(request, h);
    });
});
