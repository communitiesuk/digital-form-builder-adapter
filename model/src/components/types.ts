import {TextFieldBase} from "./ITextFieldBase";
import {ComponentDef, InputFieldsComponentsDef} from "@xgovformbuilder/model";


export interface FreeTextFieldComponent extends TextFieldBase {
    type: "FreeTextField";
    options: TextFieldBase["options"] & {
        customValidationMessage?: string;
        rows?: number;
        maxWords?: number;
    };
    schema: {
        max?: number;
        min?: number;
    };
}

export type AdapterComponentDef = ComponentDef | FreeTextFieldComponent;

export type AdapterInputFieldsComponentsDef = InputFieldsComponentsDef | FreeTextFieldComponent;
