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

export interface MultiInputFieldComponent extends TextFieldBase {
    type: "MultiInputField";
    options: TextFieldBase["options"] & {
        textFieldTitle?: string;
        numberFieldTitle?: string;
        columnTitles?: string[];
    };
    children?: []
}

export type AdapterComponentDef = ComponentDef | FreeTextFieldComponent | MultiInputFieldComponent;

export type AdapterInputFieldsComponentsDef =
    InputFieldsComponentsDef
    | FreeTextFieldComponent
    | MultiInputFieldComponent;

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
    MultiInputField = "MultiInputField",
}

export type AdapterComponentType =
    | "TextField"
    | "MultilineTextField"
    | "YesNoField"
    | "DateField"
    | "TimeField"
    | "DateTimeField"
    | "MonthYearField"
    | "DatePartsField"
    | "DateTimePartsField"
    | "SelectField"
    | "AutocompleteField"
    | "RadiosField"
    | "CheckboxesField"
    | "NumberField"
    | "UkAddressField"
    | "TelephoneNumberField"
    | "EmailAddressField"
    | "FileUploadField"
    | "Para"
    | "Html"
    | "InsetText"
    | "Details"
    | "FlashCard"
    | "List"
    | "WebsiteField"
    | "ContextComponent"
    | "FreeTextField"
    | "MultiInputField";
