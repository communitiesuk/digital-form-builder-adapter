import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";

const lab = Lab.script();
exports.lab = lab;
const {expect} = Code;
const {suite, describe, it} = lab;
import sinon from "sinon";
import {TranslationLoaderService} from "../../../../../../src/server/services/TranslationLoaderService";
import {AdapterYesNoField} from "../../../../../../src/server/plugins/engine/components/AdapterYesNoField";
import {AdapterComponentDef} from "@communitiesuk/model";
import {AdapterFormModel} from "../../../../../../src/server/plugins/engine/models";

suite("YesNoField", () => {
    describe("Generated schema", () => {
        const translationService: TranslationLoaderService = new TranslationLoaderService();
        const translations = translationService.getTranslations();
        const componentDefinition: AdapterComponentDef = {
            subType: "field",
            type: "YesNoField",
            name: "speakEnglish",
            title: "Speak English?",
            schema: {},
            options: {},
        };
        //@ts-ignore
        const formModel: AdapterFormModel = {
            makePage: () => sinon.stub(),
            getList: () => ({
                name: "__yesNo",
                title: "Yes/No",
                type: "boolean",
                items: [
                    {
                        text: "Yes",
                        value: true,
                    },
                    {
                        text: "No",
                        value: false,
                    },
                ]
            }),
            options: {
                translationEn: translations.en,
                translationCy: translations.cy,
                required: true
            }
        };

        describe("getViewModel", () => {
            //@ts-ignore
            const viewModel = {
                attributes: {},
                label: {
                    text: "Do you speak English?",
                    classes: "govuk-label--s",
                },
                id: "speakEnglish",
                name: "speakEnglish",
                value: "true",
                hint: {
                    html:
                        "You can only be added to the Find a Lawyer Abroad service if you have excellent English language skills. ",
                },
                classes: "govuk-radios--inline",
                items: [
                    {
                        text: "Yes",
                        value: true,
                        checked: true,
                    },
                    {
                        text: "No",
                        value: false,
                        checked: false,
                    },
                ],
                fieldset: {
                    legend: {
                        text: "Do you speak English?",
                        classes: "govuk-label--s",
                    },
                },
            };

            it("viewModel item Yes is checked when evaluating boolean true", () => {
                const component = new AdapterYesNoField(componentDefinition, formModel);
                const formData = {
                    speakEnglish: true,
                    lang: "en",
                };
                //@ts-ignore
                const viewModel = component.getViewModel(formData);
                //@ts-ignore
                const yesItem = viewModel.items.filter(
                    (item) => item.text === "Yes"
                )[0];

                expect(yesItem).to.equal({
                    text: "Yes",
                    value: true,
                    checked: true,
                });
            });

            it("viewModel item Yes is checked when evaluating string 'true'", () => {
                const component = new AdapterYesNoField(componentDefinition, formModel);
                const formData = {
                    speakEnglish: "true",
                    lang: "en",
                };
                //@ts-ignore
                const viewModel = component.getViewModel(formData);
                //@ts-ignore
                const yesItem = viewModel.items.filter(
                    (item) => item.text === "Yes"
                )[0];

                expect(yesItem).to.equal({
                    text: "Yes",
                    value: true,
                    checked: true,
                });
            });

            it("viewModel item No is checked when evaluating boolean false", () => {
                const component = new AdapterYesNoField(componentDefinition, formModel);
                const formData = {
                    speakEnglish: false,
                    lang: "en",
                };
                //@ts-ignore
                const viewModel = component.getViewModel(formData);
                //@ts-ignore
                const noItem = viewModel.items.filter((item) => item.text === "No")[0];

                expect(noItem).to.equal({
                    text: "No",
                    value: false,
                    checked: true,
                });
            });

            it("viewModel item No is checked when evaluating string 'false'", () => {
                const component = new AdapterYesNoField(componentDefinition, formModel);
                const formData = {
                    speakEnglish: "false",
                    lang: "en",
                };
                //@ts-ignore
                const viewModel = component.getViewModel(formData);
                //@ts-ignore
                const noItem = viewModel.items.filter((item) => item.text === "No")[0];

                expect(noItem).to.equal({
                    text: "No",
                    value: false,
                    checked: true,
                });
            });
        });
    });
});
