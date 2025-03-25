import {
    MultilineTextField as XGovMultilineTextField
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components";
import {AdapterFormModel} from "../models";
import {MultilineTextFieldComponent} from "@xgovformbuilder/model";
import Joi from "joi";

function wordCountIsOverMaxWords(input, maxWords) {
    const wordCount = input.match(/\S+/g).length || 0;
    return wordCount > maxWords;
}

export class MultilineTextField extends XGovMultilineTextField {
    constructor(def: MultilineTextFieldComponent, model: AdapterFormModel) {
        super(def, model);
        this.options = def.options;
        this.schema = def.schema;
        this.formSchema = Joi.string();
        this.formSchema = this.formSchema.label(def.title);
        const {maxWords, customValidationMessage} = def.options;
        const isRequired = def.options.required ?? true;

        if (isRequired) {
            this.formSchema = this.formSchema.required();
        } else {
            this.formSchema = this.formSchema.allow("").allow(null);
        }
        this.formSchema = this.formSchema.ruleset;

        if (maxWords ?? false) {
            this.formSchema = this.formSchema.custom((value, helpers) => {
                if (wordCountIsOverMaxWords(value, maxWords)) {
                    return helpers.error("string.maxWords", {limit: maxWords});
                }
                return value;
            }, "max words validation");
            this.isCharacterOrWordCount = true;
        }

        if (customValidationMessage) {
            this.formSchema = this.formSchema.rule({
                message: customValidationMessage,
            });
        }
    }
}
