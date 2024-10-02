import {AdapterViewModel} from "./AdapterViewModel";
import {AdapterFormModel} from "./AdapterFormModel";
import {FormSubmissionState} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {HapiRequest} from "../../../../../../digital-form-builder/runner/src/server/types";
import {AdapterInitialiseSessionOptions} from "../../initialize-session/types";
import {PageControllerBase} from "../page-controllers/PageControllerBase";

export class AdapterSummaryViewModel extends AdapterViewModel {
    markAsComplete: boolean | undefined;
    markAsCompleteComponent: boolean | undefined;
    markAsCompleteError: any;
    callback?: AdapterInitialiseSessionOptions;
    page: PageControllerBase;

    constructor(
        pageTitle: string,
        model: AdapterFormModel,
        state: FormSubmissionState,
        request: HapiRequest,
        page: PageControllerBase,
        isSavePerPageMode?: boolean
    ) {
        // @ts-ignore
        super(pageTitle, model, state, request, isSavePerPageMode);
        this.markAsCompleteComponent = state.callback?.markAsCompleteComponent;
        this.markAsComplete = state.markAsComplete;
        this.page = page;
    }


    addMarkAsCompleteAsQuestion(markAsComplete: boolean) {
        this._webhookData?.questions?.push({
            category: null,
            question: "MarkAsComplete",
            fields: [
                {
                    key: "markAsComplete",
                    title: "Do you want to mark this section as complete?",
                    type: "boolean",
                    answer: markAsComplete,
                },
            ],
        });
    }
}
