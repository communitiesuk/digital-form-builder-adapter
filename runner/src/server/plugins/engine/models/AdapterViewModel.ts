import {SummaryViewModel} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/models";
import {FormSubmissionState} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {HapiRequest} from "../../../../../../digital-form-builder/runner/src/server/types";
import {AdapterFormModel} from "./AdapterFormModel";
import {SummaryPageController} from "../page-controllers/SummaryPageController";

export class AdapterViewModel extends SummaryViewModel {


    constructor(pageTitle: string, model: AdapterFormModel, state: FormSubmissionState, request: HapiRequest) {
        // @ts-ignore
        super(pageTitle, model, state, request);
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


    static getRelevantPages(model: AdapterFormModel, state: FormSubmissionState) {
        let nextPage = model.startPage;
        const relevantPages: any[] = [];
        let endPage = null;

        while (nextPage != null) {
            if (nextPage.hasFormComponents) {
                relevantPages.push(nextPage);
            } else if (
                !nextPage.hasNext &&
                !(nextPage instanceof SummaryPageController)
            ) {
                endPage = nextPage;
            }
            nextPage = nextPage.getNextPage(state, true);
        }

        return {relevantPages, endPage};
    }

}
