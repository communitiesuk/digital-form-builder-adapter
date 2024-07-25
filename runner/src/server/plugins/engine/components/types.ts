import {
    DataType,
    ViewModel
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components/types";

export type FreeTextFieldViewModel = {
    maxlength?: number;
    isCharacterOrWordCount: boolean;
    maxWords?: number;
} & ViewModel;


export type AdapterDataType = DataType | "freeText"
