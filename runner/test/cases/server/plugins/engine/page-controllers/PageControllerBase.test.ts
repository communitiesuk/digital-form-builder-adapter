import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
//@ts-ignore
import {PageControllerBase} from "server/plugins/engine/page-controllers";
//@ts-ignore
import {AdapterFormModel} from "server/plugins/engine/models/AdapterFormModel";
import {TranslationLoaderService} from "../../../../../../src/server/services/TranslationLoaderService";

const lab = Lab.script();
exports.lab = lab;
const {expect} = Code;
const {suite, test} = lab;

suite("PageControllerBase", () => {
    test("getErrors correctly parses ISO string to readable string", () => {
        const translationService: TranslationLoaderService = new TranslationLoaderService();
        const translations = translationService.getTranslations();
        const options = {
            translationEn: translations.en,
            translationCy: translations.cy
        };
        const def = {
            title: "When will you get married?",
            path: "/first-page",
            name: "",
            components: [
                {
                    name: "approximate",
                    options: {
                        required: true,
                        maxDaysInFuture: 30,
                    },
                    type: "DateField",
                    title: "Approximate date of marriage",
                    schema: {},
                },
            ],
            next: [
                {
                    path: "/second-page",
                },
            ],
        };
        const page = new PageControllerBase(
            new AdapterFormModel(
                {
                    pages: [],
                    startPage: "/start",
                    sections: [],
                    lists: [],
                    conditions: [],
                },
                options
            ),
            def
        );
        const error = {
            error: {
                details: [
                    {
                        message:
                            '"Approximate date of marriage" must be on or before 2021-12-25T00:00:00.000Z',
                        path: ["approximate"],
                    },
                    {
                        message: "something invalid",
                        path: ["somethingElse"],
                    },
                ],
            },
        };
        const mockRequest = {
            state: {cookies_policy: {essential: true}},
            app: {location: "UK"},
            i18n: {
                __: (path: string) => {
                    return path.split('.').reduce((acc, key) => acc && acc[key], translations.en);
                }, // Mock translation function
                getLocale: () => "en",
            },
            auth: {isAuthenticated: true},
        };
        expect(page.getErrors(error, mockRequest)).to.equal({
            titleText: "There is a problem",
            errorList: [
                {
                    path: "approximate",
                    href: "#approximate",
                    name: "approximate",
                    text: `"Approximate date of marriage" must be on or before 25 December 2021`,
                },
                {
                    path: "somethingElse",
                    href: "#somethingElse",
                    name: "somethingElse",
                    text: "Something invalid",
                },
            ],
        });
    });
});
