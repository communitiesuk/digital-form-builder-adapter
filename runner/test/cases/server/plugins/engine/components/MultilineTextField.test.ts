import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
// @ts-ignore
import {MultilineTextField} from "src/server/plugins/engine/components";
// @ts-ignore
import {AdapterFormModel} from "src/server/plugins/engine/models";
// @ts-ignore
import {FormSubmissionState, FormPayload} from "src/server/plugins/engine/types";
// @ts-ignore
import {TranslationLoaderService} from "src/server/services/TranslationLoaderService";

const lab = Lab.script();
exports.lab = lab;
const {expect} = Code;
const {beforeEach, suite, test} = lab;

suite("MultilineTextField", () => {
    let model: AdapterFormModel;
    let componentDefinition: MultilineTextField;

    beforeEach(() => {
        const translationService: TranslationLoaderService = new TranslationLoaderService();
        const translations = translationService.getTranslations();
        model = {
            def: {
                metadata: {}
            },
            options: {
                translationEn: translations.en,
                translationCy: translations.cy
            }
        } as AdapterFormModel;

        componentDefinition = {
            type: "MultilineTextField",
            name: "multiLineText",
            options: {
                required: true,
                maxWords: 100,
                customValidationMessage: "Too many words!"
            },
            schema: {},
            title: "Multiline Text Field"
        };
    });

    test("should create form schema with correct structure", () => {
        const multiLineTextField = new MultilineTextField(componentDefinition, model);

        expect(multiLineTextField.formSchema).to.exist();
        expect(multiLineTextField.formSchema.type).to.equal('string');
    });

    test("getFormSchemaKeys should return form schema keys", () => {
        const multiLineTextField = new MultilineTextField(componentDefinition, model);
        const schemaKeys = multiLineTextField.getFormSchemaKeys();

        expect(schemaKeys).to.be.an.object();
        expect(schemaKeys.multiLineText).to.exist();
    });

    test("getStateSchemaKeys should return state schema keys", () => {
        const multiLineTextField = new MultilineTextField(componentDefinition, model);
        const stateSchemaKeys = multiLineTextField.getStateSchemaKeys();

        expect(stateSchemaKeys).to.be.an.object();
        expect(stateSchemaKeys.multiLineText).to.exist();
    });

    test("getFormDataFromState should return form data from state", () => {
        const multiLineTextField = new MultilineTextField(componentDefinition, model);
        const state: FormSubmissionState = {multiLineText: "sample text"};
        const formData = multiLineTextField.getFormDataFromState(state);

        expect(formData).to.be.an.object();
        expect(formData.multiLineText).to.equal("sample text");
    });

    test("getViewModel should return view model from form data and errors", () => {
        const multiLineTextField = new MultilineTextField(componentDefinition, model);
        const formData = {multiLineText: "sample text"};
        const errors = {};
        const viewModel = multiLineTextField.getViewModel(formData, errors);

        expect(viewModel).to.be.an.object();
        expect(viewModel.isCharacterOrWordCount).to.be.true();
        expect(viewModel.maxwords).to.equal(100);
    });
});
