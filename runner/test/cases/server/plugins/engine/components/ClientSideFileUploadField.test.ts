import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import joi from "joi";
import FormData from "form-data";
//@ts-ignore
import {ClientSideFileUploadField} from "src/server/plugins/engine/components";
//@ts-ignore
import {AdapterFormModel} from "src/server/plugins/engine/models";
import {ClientSideFileUploadFieldComponent} from "@communitiesuk/model";
//@ts-ignore
import {TranslationLoaderService} from "src/server/services/TranslationLoaderService";

const lab = Lab.script();
exports.lab = lab;
const {expect} = Code;
const {beforeEach, suite, test} = lab;

suite("ClientSideFileUploadField", () => {
    let model: AdapterFormModel;

    beforeEach(() => {
        const translationService: TranslationLoaderService = new TranslationLoaderService();
        const translations = translationService.getTranslations();
        model = {
            options: {
                translationEn: translations.en,
                translationCy: translations.cy
            }
        } as AdapterFormModel;
    });

    test("should initialize with given definition and model", () => {
        //@ts-ignore
        const def: ClientSideFileUploadFieldComponent = {
            type: "ClientSideFileUploadField",
            name: "myComponent",
            title: "My component",
            schema: {},
            options: {},
        };

        const component = new ClientSideFileUploadField(def, model);

        expect(component.type).to.equal(def.type);
        expect(component.name).to.equal(def.name);
        expect(component.title).to.equal(def.title);
        expect(component.schema).to.equal(def.schema);
        expect(component.options).to.equal(def.options);
    });

    test("should return form schema keys", () => {
        //@ts-ignore
        const def: ClientSideFileUploadFieldComponent = {
            type: "ClientSideFileUploadField",
            name: "myComponent",
            title: "My component",
            schema: {},
            options: {},
        };

        const component = new ClientSideFileUploadField(def, model);
        const formSchemaKeys = component.getFormSchemaKeys();

        expect(formSchemaKeys).to.equal({
            myComponent: joi.allow("").allow(null),
            "myComponent__filename": joi.string().optional(),
            "myComponent__delete[]": joi.string().optional(),
        });
    });

    test("should return default view model", () => {
        //@ts-ignore
        const def: ClientSideFileUploadFieldComponent = {
            type: "ClientSideFileUploadField",
            name: "myComponent",
            title: "My component",
            schema: {},
            options: {},
        };

        const component = new ClientSideFileUploadField(def, model);
        const viewModel = component.getViewModel(new FormData(), {});

        expect(viewModel).to.include({
            dropzoneConfig: def.options.dropzoneConfig,
            existingFiles: [],
            pageAndForm: null,
            showNoScriptWarning: def.options.showNoScriptWarning || false,
            totalOverallFilesize: def.options.totalOverallFilesize,
            //@ts-ignore
            hideTitle: def.options.hideTitle || false,
            label: {
                text: def.title,
                classes: "govuk-label--s",
            },
        });
    });
});
