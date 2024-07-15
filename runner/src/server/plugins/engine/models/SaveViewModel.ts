import { AdapterFormModel } from "./AdapterFormModel";
import { ViewModel } from "./ViewModel";
import { HapiRequest } from "../../../types";
import {
    FeesModel,
    WebhookModel
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/models/submission";
import { FormSubmissionState } from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";

export class SaveViewModel extends ViewModel {
    /**
     * Responsible for parsing state values to the govuk-frontend summary list template and parsing data for outputs
     * The plain object is also used to generate data for outputs
     */

    constructor(
        pageTitle: string,
        model: AdapterFormModel,
        state: FormSubmissionState,
        request: HapiRequest
    ) {
        super(pageTitle, model, state, request);

        const { relevantPages } = SaveViewModel.getRelevantPages(model, state);
        const details = this.summaryDetails(request, model, state, relevantPages);

        this.fees = FeesModel(model, state);
        //@ts-ignore
        this._webhookData = WebhookModel(relevantPages, details, model, this.fees);
        this._webhookData = this.addFeedbackSourceDataToWebhook(
            this._webhookData,
            model,
            request
        );
    }
}
