import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import {UkAddressFieldComponent} from "@xgovformbuilder/model";
// @ts-ignore
import {UkAddressField} from "src/server/plugins/engine/components";
// @ts-ignore
import {TranslationLoaderService} from "src/server/services/TranslationLoaderService";
// @ts-ignore
import {AdapterFormModel} from "src/server/plugins/engine/models";

const lab = Lab.script();
exports.lab = lab;
const {expect} = Code;
const {beforeEach, suite, test} = lab;

suite("UK Address field", () => {
    let model: AdapterFormModel;

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
    });

    test("should create form children with correct structure", () => {
        const def: UkAddressFieldComponent = {
            name: "address",
            title: "Address",
            type: "UkAddressField",
            options: {},
            schema: {},
        };

        const ukAddressField = new UkAddressField(def, model);

        expect(ukAddressField.formChildren.items).to.have.length(5);
        expect(ukAddressField.formChildren.items[0].name).to.equal("address__addressLine1");
        expect(ukAddressField.formChildren.items[1].name).to.equal("address__addressLine2");
        expect(ukAddressField.formChildren.items[2].name).to.equal("address__town");
        expect(ukAddressField.formChildren.items[3].name).to.equal("address__county");
        expect(ukAddressField.formChildren.items[4].name).to.equal("address__postcode");
    });

    test("should set correct titles for English", () => {
        const def: UkAddressFieldComponent = {
            name: "address",
            title: "Address",
            type: "UkAddressField",
            options: {},
            schema: {},
        };

        const ukAddressField = new UkAddressField(def, model);

        expect(ukAddressField.formChildren.items[0].title).to.equal("Address line 1");
        expect(ukAddressField.formChildren.items[1].title).to.equal("Address line 2");
        expect(ukAddressField.formChildren.items[2].title).to.equal("Town or city");
        expect(ukAddressField.formChildren.items[3].title).to.equal("County");
        expect(ukAddressField.formChildren.items[4].title).to.equal("Postcode");
    });

    test("should set correct titles for Welsh", () => {
        model.def.metadata.isWelsh = true;
        const def: UkAddressFieldComponent = {
            name: "address",
            title: "Address",
            type: "UkAddressField",
            options: {},
            schema: {},
        };

        const ukAddressField = new UkAddressField(def, model);

        expect(ukAddressField.formChildren.items[0].title).to.equal("Llinell cyfeiriad 1");
        expect(ukAddressField.formChildren.items[1].title).to.equal("Llinell cyfeiriad 2");
        expect(ukAddressField.formChildren.items[2].title).to.equal("Tref neu ddinas");
        expect(ukAddressField.formChildren.items[3].title).to.equal("Sir");
        expect(ukAddressField.formChildren.items[4].title).to.equal("Cod post");
    });

    test("should set required fields correctly", () => {
        const def: UkAddressFieldComponent = {
            name: "address",
            title: "Address",
            type: "UkAddressField",
            options: {},
            schema: {},
        };

        const ukAddressField = new UkAddressField(def, model);

        expect(ukAddressField.formChildren.items[0].options.required).to.be.true();
        expect(ukAddressField.formChildren.items[1].options.required).to.be.false();
        expect(ukAddressField.formChildren.items[2].options.required).to.be.true();
        expect(ukAddressField.formChildren.items[3].options.required).to.be.false();
        expect(ukAddressField.formChildren.items[4].options.required).to.be.true();
    });

    test("should set all fields as optional when required is false", () => {
        const def: UkAddressFieldComponent = {
            name: "address",
            title: "Address",
            type: "UkAddressField",
            options: {required: false},
            schema: {},
        };

        const ukAddressField = new UkAddressField(def, model);

        ukAddressField.formChildren.items.forEach(component => {
            expect(component.options.required).to.be.false();
        });
    });

    test("should validate postcode format", () => {
        const def: UkAddressFieldComponent = {
            name: "address",
            title: "Address",
            type: "UkAddressField",
            options: {},
            schema: {},
        };

        const ukAddressField = new UkAddressField(def, model);
        const postcodeComponent = ukAddressField.formChildren.items[4];

        expect(postcodeComponent.schema.regex).to.equal("^([A-Za-z][A-Ha-hJ-Yj-y]?[0-9][A-Za-z0-9]? ?[0-9][A-Za-z]{2}|[Gg][Ii][Rr] ?0[Aa]{2})$");
    });
});

suite("UK Address field methods", () => {
    let model: AdapterFormModel;
    let ukAddressField: UkAddressField;

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

        const def: UkAddressFieldComponent = {
            name: "address",
            title: "Address",
            type: "UkAddressField",
            options: {},
            schema: {},
        };

        ukAddressField = new UkAddressField(def, model);
    });

    test("getFormDataFromState should handle string value", () => {
        const state = {
            address: "Apt 4, 123 Main St, City, County, AB12 3CD"
        };

        const result = ukAddressField.getFormDataFromState(state);

        expect(result).to.equal({
            "address__addressLine1": "Apt 4",
            "address__addressLine2": "123 Main St",
            "address__town": "City",
            "address__county": "County",
            "address__postcode": "AB12 3CD"
        });
    });

    test("getFormDataFromState should handle object value", () => {
        const state = {
            address: {
                addressLine1: "123 Main St",
                addressLine2: "Apt 4",
                town: "City",
                county: "County",
                postcode: "AB12 3CD"
            }
        };

        const result = ukAddressField.getFormDataFromState(state);

        expect(result).to.equal({
            "address__addressLine1": "123 Main St",
            "address__addressLine2": "Apt 4",
            "address__town": "City",
            "address__county": "County",
            "address__postcode": "AB12 3CD"
        });
    });

    test("getStateValueFromValidForm should return correct object", () => {
        const payload = {
            "address__addressLine1": "123 Main St",
            "address__addressLine2": "Apt 4",
            "address__town": "City",
            "address__county": "County",
            "address__postcode": "AB12 3CD"
        };

        const result = ukAddressField.getStateValueFromValidForm(payload);

        expect(result).to.equal({
            addressLine1: "123 Main St",
            addressLine2: "Apt 4",
            town: "City",
            county: "County",
            postcode: "AB12 3CD"
        });
    });

    test("getDisplayStringFromState should handle object value", () => {
        const state = {
            address: {
                addressLine1: "123 Main St",
                addressLine2: "Apt 4",
                town: "City",
                county: "County",
                postcode: "AB12 3CD"
            }
        };

        const result = ukAddressField.getDisplayStringFromState(state);

        expect(result).to.equal("123 Main St, Apt 4, City, County, AB12 3CD");
    });

    test("getDisplayStringFromState should handle string value", () => {
        const state = {
            address: "123 Main St, City, County, AB12 3CD"
        };

        const result = ukAddressField.getDisplayStringFromState(state);

        expect(result).to.equal("123 Main St, City, County, AB12 3CD");
    });

    test("isValidCounty should return true for valid counties", () => {
        expect(ukAddressField.isValidCounty("Devon")).to.be.true();
        expect(ukAddressField.isValidCounty("Greater London")).to.be.true();
        expect(ukAddressField.isValidCounty("Fife")).to.be.true();
        expect(ukAddressField.isValidCounty("Glamorgan")).to.be.true();
        expect(ukAddressField.isValidCounty("Antrim")).to.be.true();
    });

    test("isValidCounty should return false for invalid counties", () => {
        expect(ukAddressField.isValidCounty("InvalidCounty")).to.be.false();
        expect(ukAddressField.isValidCounty("123")).to.be.false();
        expect(ukAddressField.isValidCounty("")).to.be.false();
    });
});
