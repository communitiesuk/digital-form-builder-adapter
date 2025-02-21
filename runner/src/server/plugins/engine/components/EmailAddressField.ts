//@ts-ignore
import {InputFieldsComponentsDef} from "@xgovformbuilder/model";
import {AdapterFormModel} from "../models";
import {
  addClassOptionIfNone,
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components/helpers";
import {
  EmailAddressField as XGovEmailAddressField
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components";
import Joi from "joi";

export class EmailAddressField extends XGovEmailAddressField {
    private defaultMessage: string = "Enter an email address in the correct format, like name@example.com";
    formSchema: Joi.StringSchema;
    options: InputFieldsComponentsDef["options"];
    schema: InputFieldsComponentsDef["schema"];

    constructor(def: InputFieldsComponentsDef, model: AdapterFormModel) {
        //@ts-ignore
        super(def, model);

        this.options = def.options;
        this.schema = def.schema;
        this.formSchema = Joi.string();

        const isRequired = def.options.required ?? true;

        if (isRequired) {
            this.formSchema = this.formSchema.required();
        } else {
            this.formSchema = this.formSchema.allow("").allow(null).optional();
        }

        this.formSchema = this.formSchema
            .label(def.title.toLowerCase())  // Label for error messages
            .email({tlds: {allow: false}}) // Strict email format validation (without allowing specific TLDs)
            .messages({
                //@ts-ignore
                "string.email": def.options?.customValidationMessage ?? this.defaultMessage, // Custom error message
            });
        addClassOptionIfNone(this.options, "govuk-input--width-20");

    }

    getFormSchemaKeys() {
        return {
            [this.name]: this.formSchema,
        };
    }

    getStateSchemaKeys() {
        return {
            [this.name]: this.formSchema,
        };
    }
}
