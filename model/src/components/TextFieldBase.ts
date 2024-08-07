export interface TextFieldBase {
    subType?: "field";
    type: string;
    name: string;
    title: string;
    hint?: string;
    options: {
        hideTitle?: boolean;
        required?: boolean;
        optionalText?: boolean;
        classes?: string;
        allow?: string;
        autocomplete?: string;
        noReturnUrlOnSummaryPage?: boolean;
        prefix?: string;
    };
    schema: {
        max?: number;
        min?: number;
        length?: number;
        regex?: string;
        error?: any;
    };
    children?: TextFieldBase[];
}
