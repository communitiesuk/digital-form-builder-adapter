import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
//@ts-ignore
import {Component} from "src/server/plugins/engine/components";
//@ts-ignore
import {AdapterFormModel} from "src/server/plugins/engine/models";
import {AdapterComponentDef} from "@communitiesuk/model";
//@ts-ignore
import {TranslationLoaderService} from "src/server/services/TranslationLoaderService";

const lab = Lab.script();
exports.lab = lab;
const {expect} = Code;
const {beforeEach, suite, test} = lab;

suite("Component", () => {
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
        const def: AdapterComponentDef = {
            //@ts-ignore
            type: "text",
            name: "myComponent",
            title: "My component",
            schema: {},
            options: {},
        };

        const component = new Component(def, model);

        expect(component.type).to.equal(def.type);
        expect(component.name).to.equal(def.name);
        expect(component.title).to.equal(def.title);
        expect(component.schema).to.equal(def.schema);
        expect(component.options).to.equal(def.options);
        expect(component.hint).to.be.undefined();
        expect(component.content).to.be.undefined();
    });

    test("should set hint and content if provided", () => {
        const def: AdapterComponentDef = {
            //@ts-ignore
            type: "text",
            name: "myComponent",
            title: "My component",
            schema: {},
            options: {},
            hint: "a hint",
            content: "some content",
        };

        const component = new Component(def, model);
        //@ts-ignore
        expect(component.hint).to.equal(def.hint);
        //@ts-ignore
        expect(component.content).to.equal(def.content);
    });

    test("should return default view model", () => {
        const def: AdapterComponentDef = {
            //@ts-ignore
            type: "text",
            name: "myComponent",
            title: "My component",
            schema: {},
            options: {},
        };

        const component = new Component(def, model);
        const viewModel = component.getViewModel(new FormData());

        expect(viewModel).to.equal({
            attributes: {},
        });
    });
});
