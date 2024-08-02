import {TextFieldBase} from "./TextFieldBase";
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

export enum AdapterComponentTypeEnum {
    TextField = "TextField",
    MultilineTextField = "MultilineTextField",
    YesNoField = "YesNoField",
    DateField = "DateField",
    TimeField = "TimeField",
    DateTimeField = "DateTimeField",
    DatePartsField = "DatePartsField",
    MonthYearField = "MonthYearField",
    DateTimePartsField = "DateTimePartsField",
    SelectField = "SelectField",
    AutocompleteField = "AutocompleteField",
    RadiosField = "RadiosField",
    CheckboxesField = "CheckboxesField",
    NumberField = "NumberField",
    UkAddressField = "UkAddressField",
    TelephoneNumberField = "TelephoneNumberField",
    EmailAddressField = "EmailAddressField",
    FileUploadField = "FileUploadField",
    Para = "Para",
    Html = "Html",
    InsetText = "InsetText",
    Details = "Details",
    FlashCard = "FlashCard",
    List = "List",
    ContextComponent = "ContextComponent",
    FreeTextField = "FreeTextField",
}
