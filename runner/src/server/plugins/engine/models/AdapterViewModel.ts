import {FormSubmissionState} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {HapiRequest} from "../../../../../../digital-form-builder/runner/src/server/types";
import {AdapterFormModel} from "./AdapterFormModel";
import {ViewModelBase} from "./ViewModelBase";
import {PageControllerBase} from "../page-controllers/PageControllerBase";

export class AdapterViewModel extends ViewModelBase {
    constructor(
        pageTitle: string,
        model: AdapterFormModel,
        state: FormSubmissionState,
        request: HapiRequest,
        page: PageControllerBase,
        isSavePerPageMode?: boolean,
        validateStateTillGivenPath?: string) {
        // @ts-ignore
        super(pageTitle, model, state, request, page, isSavePerPageMode, validateStateTillGivenPath);
        if (this.details.length > 0) {
            let notSuppliedText = "Not supplied";
            let changeText = "Change";
            if (model?.def?.metadata?.isWelsh) {
                notSuppliedText = "Heb ei ddarparu";
                changeText = "Newid";
            }
            this.details = this.details.map(detail => {
                return {
                    ...detail,
                    notSuppliedText: notSuppliedText,
                    changeText
                };
            });
        }
    }

}
