import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
// @ts-ignore
import {FreeTextField} from "src/server/plugins/engine/components";
// @ts-ignore
import {AdapterFormModel} from "src/server/plugins/engine/models";
// @ts-ignore
import {FormSubmissionState, FormPayload} from "src/server/plugins/engine/types";
import {FreeTextFieldComponent} from "@communitiesuk/model";
// @ts-ignore
import {TranslationLoaderService} from "src/server/services/TranslationLoaderService";

const lab = Lab.script();
exports.lab = lab;
const {expect} = Code;
const {beforeEach, suite, test} = lab;

suite("FreeTextField", () => {
    let model: AdapterFormModel;
    let componentDefinition: FreeTextFieldComponent;

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
            type: "FreeTextField",
            name: "freeText",
            options: {
                required: true,
                maxWords: 100,
                customValidationMessage: "Too many words!"
            },
            schema: {},
            title: "Free Text Field"
        };
    });

    test("should create form schema with correct structure", () => {
        const freeTextField = new FreeTextField(componentDefinition, model);

        expect(freeTextField.formSchema).to.exist();
        expect(freeTextField.formSchema.type).to.equal('string');
    });

    test("getFormSchemaKeys should return form schema keys", () => {
        const freeTextField = new FreeTextField(componentDefinition, model);
        const schemaKeys = freeTextField.getFormSchemaKeys();

        expect(schemaKeys).to.be.an.object();
        expect(schemaKeys.freeText).to.exist();
    });

    test("getStateSchemaKeys should return state schema keys", () => {
        const freeTextField = new FreeTextField(componentDefinition, model);
        const stateSchemaKeys = freeTextField.getStateSchemaKeys();

        expect(stateSchemaKeys).to.be.an.object();
        expect(stateSchemaKeys.freeText).to.exist();
    });

    test("getFormDataFromState should return form data from state", () => {
        const freeTextField = new FreeTextField(componentDefinition, model);
        const state: FormSubmissionState = {freeText: "sample text"};
        const formData = freeTextField.getFormDataFromState(state);

        expect(formData).to.be.an.object();
        expect(formData.freeText).to.equal("sample text");
    });

    test("getViewModel should return view model from form data and errors", () => {
        const freeTextField = new FreeTextField(componentDefinition, model);
        const formData = {freeText: "sample text"};
        const errors = {};
        const viewModel = freeTextField.getViewModel(formData, errors);

        expect(viewModel).to.be.an.object();
        expect(viewModel.isCharacterOrWordCount).to.be.true();
        expect(viewModel.maxWords).to.equal(100);
    });
});
