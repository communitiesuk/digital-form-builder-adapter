import {AdapterViewModel} from "./AdapterViewModel";
import {AdapterFormModel} from "./AdapterFormModel";
import { buildWindowTitle } from "../util/windowTitle";
import {FormSubmissionState} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {HapiRequest} from "../../../../../../digital-form-builder/runner/src/server/types";
import {AdapterInitialiseSessionOptions} from "../../initialize-session/types";
import {PageControllerBase} from "../page-controllers/PageControllerBase";

export class AdapterSummaryViewModel extends AdapterViewModel {
    markAsComplete: boolean | undefined;
    markAsCompleteComponent: boolean | undefined;
    markAsCompleteError: any;
    callback?: AdapterInitialiseSessionOptions;
    windowTitle: string;

    constructor(
        pageTitle: string,
        model: AdapterFormModel,
        state: FormSubmissionState,
        request: HapiRequest,
        page: PageControllerBase,
        isSavePerPageMode?: boolean,
        validateStateTillGivenPath?: string
    ) {
        super(pageTitle, model, state, request, page, isSavePerPageMode, validateStateTillGivenPath);
        this.markAsCompleteComponent = state.callback?.markAsCompleteComponent;
        this.markAsComplete = state.markAsComplete;

        const serviceName = model.name || "";
        this.windowTitle = buildWindowTitle(pageTitle, serviceName);
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
