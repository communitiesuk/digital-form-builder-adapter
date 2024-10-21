import {TelephoneNumberField} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components";
import {TelephoneNumberFieldComponent} from "@xgovformbuilder/model";
import {AdapterFormModel} from "../models";
// @ts-ignore
import joi from "joi";
import {
    internationalPhoneValidator
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components/helpers";

const PATTERN = /^[0-9\\\s+()-]*$/;

export class AdapterTelephoneNumberField extends TelephoneNumberField {

    constructor(def: TelephoneNumberFieldComponent, model: AdapterFormModel) {
        //@ts-ignore
        super(def, model);
        //@ts-ignore
        let incorrectFormat = model.options.translationEn.validation.telephoneNumberField.incorrectFormat;
        if (model.def.metadata?.isWelsh) {
            //@ts-ignore
            incorrectFormat = model.options.translationCy.validation.telephoneNumberField.incorrectFormat;
        }
        const {options = {}, schema = {}} = def;
        const pattern = schema.regex ? new RegExp(schema.regex) : PATTERN;
        let componentSchema = joi.string();

        if (options.required === false) {
            componentSchema = componentSchema.allow("").allow(null);
        }
        componentSchema = componentSchema
            .pattern(pattern)
            .message(incorrectFormat)
            .label(def.title.toLowerCase());

        if (schema.max) {
            componentSchema = componentSchema.max(schema.max);
        }

        if (schema.min) {
            componentSchema = componentSchema.min(schema.min);
        }

        if (options.isInternational) {
            // @ts-ignore
            componentSchema = componentSchema.custom(internationalPhoneValidator);
        }

        if (options.customValidationMessages) {
            componentSchema = componentSchema.messages(
                options.customValidationMessages
            );
        }
        this.schema = componentSchema;
    }
}
