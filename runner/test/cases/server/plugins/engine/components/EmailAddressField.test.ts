import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
//@ts-ignore
import {InputFieldsComponentsDef} from "@xgovformbuilder/model";
// @ts-ignore
import {EmailAddressField} from "src/server/plugins/engine/components";
// @ts-ignore
import {AdapterFormModel} from "src/server/plugins/engine/models";
// @ts-ignore
import {TranslationLoaderService} from "src/server/services/TranslationLoaderService";

const lab = Lab.script();
exports.lab = lab;
const {expect} = Code;
const {beforeEach, suite, test} = lab;

suite("EmailAddress field", () => {
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

    test("should be required by default", () => {
        const def: InputFieldsComponentsDef = {
            name: "myComponent",
            title: "My component",
            type: "EmailAddressField",
            hint: "a hint",
            options: {},
            schema: {},
        };

        const {formSchema} = new EmailAddressField(def, model);

        expect(formSchema.describe().flags!["presence"]).to.equal("required");
    });

    test("should validate email", () => {
        const def: InputFieldsComponentsDef = {
            name: "myComponent",
            title: "My component",
            type: "EmailAddressField",
            hint: "a hint",
            options: {},
            schema: {},
        };

        const {formSchema} = new EmailAddressField(def, model);

        expect(formSchema.validate("test@email.com").error).to.be.undefined();
        expect(formSchema.validate("test").error!.message).to.contain(
            `Enter an email address in the correct format, like name@example.com`
        );
        expect(formSchema.validate("test@email").error!.message).to.contain(
            `Enter an email address in the correct format, like name@example.com`
        );
    });

    test("should display custom error message", () => {
        const def: InputFieldsComponentsDef = {
            name: "myComponent",
            title: "My component",
            type: "EmailAddressField",
            hint: "a hint",
            options: {
                customValidationMessage: "Enter valid email address",
            },
            schema: {},
        };

        const {formSchema} = new EmailAddressField(def, model);

        expect(formSchema.validate("www.gov.uk").error?.message).to.contain(
            "Enter valid email address"
        );
    });

    test("should be required by default", () => {
        const def: InputFieldsComponentsDef = {
            name: "myComponent",
            title: "My component",
            type: "EmailAddressField",
            hint: "a hint",
            options: {},
            schema: {},
        };

        const {formSchema} = new EmailAddressField(def, model);

        expect(formSchema.validate("").error?.message).to.contain(
            `"my component" is not allowed to be empty`
        );

        expect(formSchema.validate(null).error?.message).to.contain(
            `"my component" must be a string`
        );
    });

    test("should allow empty strings and null values when not required", () => {
        const def: InputFieldsComponentsDef = {
            name: "myComponent",
            title: "My component",
            type: "EmailAddressField",
            hint: "a hint",
            options: {
                required: false,
            },
            schema: {},
        };

        const {formSchema} = new EmailAddressField(def, model);

        expect(formSchema.validate("").error).to.be.undefined();

        expect(formSchema.validate(null).error).to.be.undefined();
    });

});
