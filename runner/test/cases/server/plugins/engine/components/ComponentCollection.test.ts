import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
//@ts-ignore
import {ComponentCollection} from "src/server/plugins/engine/components";
//@ts-ignore
import {AdapterFormModel} from "src/server/plugins/engine/models";
import {AdapterComponentDef} from "@communitiesuk/model";
//@ts-ignore
import * as Components from "src/server/plugins/engine/components/index";
import joi from "joi";
//@ts-ignore
import {TranslationLoaderService} from "src/server/services/TranslationLoaderService";

const lab = Lab.script();
exports.lab = lab;
const {expect} = Code;
const {beforeEach, suite, test} = lab;

suite("ComponentCollection", () => {
    let model: AdapterFormModel;
    let componentDefinition: AdapterComponentDef[];

    beforeEach(() => {
        const translationService: TranslationLoaderService = new TranslationLoaderService();
        const translations = translationService.getTranslations();
        model = {
            options: {
                translationEn: translations.en,
                translationCy: translations.cy
            }
        } as AdapterFormModel;

        // @ts-ignore
        componentDefinition = [{type: "MockComponent", name: "mockComponent"}];

        (Components as any).MockComponent = class {
            isFormComponent = true;
            getFormSchemaKeys = () => ({mockKey: joi.string()});
            getStateSchemaKeys = () => ({mockKey: joi.string()});
            getAdditionalValidationFunctions = () => [() => {
            }];
            getFormDataFromState = () => ({mockKey: "mockValue"});
            getStateFromValidForm = () => ({mockKey: "mockValue"});
            getViewModel = () => ({type: "MockComponent", model: {}});
        };
    });

    test("should initialize with given components and model", () => {
        const collection = new ComponentCollection(componentDefinition, model);
        expect(collection.items.length).to.equal(1);
        expect(collection.formItems.length).to.equal(1);
    });

    test("should generate form schema keys", () => {
        const collection = new ComponentCollection(componentDefinition, model);
        const formSchemaKeys = collection.getFormSchemaKeys();
        expect(formSchemaKeys).to.be.an.object();
        expect(formSchemaKeys).to.include({mockKey: joi.string()});
    });

    test("should generate state schema keys", () => {
        const collection = new ComponentCollection(componentDefinition, model);
        const stateSchemaKeys = collection.getStateSchemaKeys();
        expect(stateSchemaKeys).to.be.an.object();
        expect(stateSchemaKeys).to.include({mockKey: joi.string()});
    });

    test("should get all additional validation functions", () => {
        const collection = new ComponentCollection(componentDefinition, model);
        const validationFunctions = collection.getAllAdditionalValidationFunctions();
        expect(validationFunctions.length).to.equal(1);
    });


    test("should get form data from state", () => {
        const collection = new ComponentCollection(componentDefinition, model);
        const formData = collection.getFormDataFromState({} as any);
        expect(formData).to.be.an.object();
        expect(formData).to.include({mockKey: "mockValue"});
    });

    test("should get state from valid form", () => {
        const collection = new ComponentCollection(componentDefinition, model);
        const state = collection.getStateFromValidForm({} as any);
        expect(state).to.be.an.object();
        expect(state).to.include({mockKey: "mockValue"});
    });

    test("should get view model", () => {
        const collection = new ComponentCollection(componentDefinition, model);
        const viewModel = collection.getViewModel({} as any);
        expect(viewModel).to.be.an.array();
        expect(viewModel.length).to.equal(1);
        expect(viewModel[0].model).to.include({type: "MockComponent"});
    });
});
