//@ts-ignore
import {InputFieldsComponentsDef} from "@xgovformbuilder/model";
import {AdapterFormModel} from "../models";
import {AdapterFormComponent} from "./AdapterFormComponent";
import { FormData, FormSubmissionErrors } from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {
  addClassOptionIfNone,
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components/helpers";
import Joi from "joi";

export class EmailAddressField extends AdapterFormComponent {
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
            this.formSchema = this.formSchema.allow("").allow(null);
        }

    this.formSchema = this.formSchema
            .label(def.title.toLowerCase())  // Label for error messages
            .email({ tlds: { allow: false } }) // Strict email format validation (without allowing specific TLDs)
            //@ts-ignore
            .message(def.options?.customValidationMessage ?? this.defaultMessage)  // Custom message if provided
            .messages({
                "string.email": this.defaultMessage,  // Default message for invalid email
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

  getViewModel(formData: FormData, errors: FormSubmissionErrors) {
    const options: any = this.options;
        const {prefix} = options;

   const viewModelPrefix = {prefix: {text: prefix}};
    return {
        //@ts-ignore
        ...super.getViewModel(formData, errors),
        type: "email",
        // ...False returns nothing, so only adds content when
        // the given options are present.
        ...(options.prefix && viewModelPrefix),
    };
  }
}
