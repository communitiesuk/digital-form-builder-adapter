import {
    DataType,
    ViewModel
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components/types";
import {S3Object} from "../../../services/S3UploadService";

export type FreeTextFieldViewModel = {
    maxlength?: number;
    isCharacterOrWordCount: boolean;
    maxWords?: number;
} & ViewModel;

export type ClientSideFileUploadFieldViewModel = {
  dropzoneConfig: object;
  existingFiles: S3Object[];
  pageAndForm: string;
  showNoScriptWarning?: boolean;
  totalOverallFilesize?: number;
  hideTitle?: boolean;
} & ViewModel;


export type AdapterDataType = DataType | "freeText" | "multiInput";


