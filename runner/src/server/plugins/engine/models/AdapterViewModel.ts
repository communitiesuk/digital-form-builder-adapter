import {
    SummaryViewModel
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/models";
import {FormSubmissionState} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {HapiRequest} from "../../../../../../digital-form-builder/runner/src/server/types";
import {AdapterFormModel} from "./AdapterFormModel";
import {AdapterSummaryPageController} from "../page-controllers/AdapterSummaryPageController";

export class AdapterViewModel extends SummaryViewModel {

    constructor(pageTitle: string, model: AdapterFormModel, state: FormSubmissionState, request: HapiRequest) {
        // @ts-ignore
        super(pageTitle, model, state, request);
    }


    static getRelevantPages(model: AdapterFormModel, state: FormSubmissionState) {
        let nextPage = model.startPage;
        const relevantPages: any[] = [];
        let endPage = null;

        while (nextPage != null) {
            if (nextPage.hasFormComponents) {
                relevantPages.push(nextPage);
            } else if (
                !nextPage.hasNext &&
                !(nextPage instanceof AdapterSummaryPageController)
            ) {
                endPage = nextPage;
            }
            nextPage = nextPage.getNextPage(state, true);
        }

        return {relevantPages, endPage};
    }

}
