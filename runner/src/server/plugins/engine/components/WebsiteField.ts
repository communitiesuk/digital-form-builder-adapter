import {WebsiteFieldComponent} from "@xgovformbuilder/model";
import Joi, {StringSchema} from "joi";
import {AdapterFormModel} from "../models";
import {TextField} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components";
import {
    addClassOptionIfNone
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components/helpers";
import {FormSubmissionErrors} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";

export class WebsiteField extends TextField {
    private defaultMessage = "Enter website address in the correct format, e.g. 'www.gov.uk'";

    formSchema: StringSchema;
    options: WebsiteFieldComponent["options"];
    schema: WebsiteFieldComponent["schema"];

    constructor(def: WebsiteFieldComponent, model: AdapterFormModel) {
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
            .label(def.title.toLowerCase())
            .pattern(/^((https?|HTTPS?):\/\/)?(www\.)?[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})(\.[a-zA-Z0-9]{2,})?/)
            .uri()
            .message(def.options?.customValidationMessage ?? this.defaultMessage)
            .messages({
                "string.pattern.base": this.defaultMessage,
            });

        if (def.schema.max) {
            this.formSchema = this.formSchema.max(def.schema.max);
        }

        if (def.schema.min) {
            this.formSchema = this.formSchema.min(def.schema.min);
        }

        addClassOptionIfNone(this.options, "govuk-input--width-10");
    }

    //@ts-ignore
    getFormSchemaKeys() {
        return {
            [this.name]: this.formSchema,
        };
    }

    //@ts-ignore
    getStateSchemaKeys() {
        return {
            [this.name]: this.formSchema,
        };
    }

    //@ts-ignore
    getViewModel(formData: FormData, errors: FormSubmissionErrors) {
        const options: any = this.options;
        const {prefix} = options;
        const viewModelPrefix = {prefix: {text: prefix}};
        const viewModel = {
            //@ts-ignore
            ...super.getViewModel(formData, errors),
            type: "website",
            // ...False returns nothing, so only adds content when
            // the given options are present.
            ...(options.prefix && viewModelPrefix),
        };

        if (options.hideTitle) {
            viewModel.label = {text: "", html: viewModel.hint?.html!, classes: ""};
            viewModel.hint = {html: this.localisedString(this.hint)};
        }

        return viewModel;
    }
}
