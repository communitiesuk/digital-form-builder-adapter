import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {AdapterFormModel} from "../models";
import {AdapterSummaryViewModel} from "../models";
import {PageController} from "./PageController";
import {FormSubmissionState} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {
    SummaryPageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";

const LOGGER_DATA = {
    class: "DefaultPageController",
}

export class DefaultPageController extends PageController {

    constructor(model: AdapterFormModel, pageDef: any) {
        //@ts-ignore
        super(model, pageDef);
    }

    makePostRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            const response = await this.handlePostRequest(request, h);
            const {returnUrl} = request.query
            if (response?.source?.context?.errors) {
                return response;
            }
            const {adapterCacheService, adapterStatusService} = request.services([]);
            //@ts-ignore
            let state = await adapterCacheService.getState(request);
            if (state.metadata) {
                state.metadata.isSummaryPageSubmit = false;
            }

            const model = this.model;
            //@ts-ignore
            const summaryViewModel = new AdapterSummaryViewModel(this.title, model, state, request, this, (!returnUrl) ? this.path : undefined);
            //@ts-ignore
            const savedState = await adapterCacheService.getState(request);
            //This is required to ensure we don't navigate to an incorrect page based on stale state values
            let relevantState = this.getConditionEvaluationContext(this.model, savedState);
            //@ts-ignore
            await adapterCacheService.mergeState(request, {
                ...state,
                webhookData: summaryViewModel.validatedWebhookData,
            });
            //@ts-ignore
            state = await adapterCacheService.getState(request);

            if (state.metadata && state.webhookData) {
                const {callback} = state;
                if (callback && callback.callbackUrl) {
                    request.logger.info({
                        ...LOGGER_DATA,
                        message: `Viewable data for user [${JSON.stringify(summaryViewModel.details)}]`,
                        form_session_identifier: state.metadata?.form_session_identifier ?? ""
                    });
                    request.logger.info({
                        ...LOGGER_DATA,
                        message: `Save per page triggerred and saving following data [${JSON.stringify(summaryViewModel._webhookData)}]`,
                        form_session_identifier: state.metadata?.form_session_identifier ?? ""
                    });
                    //@ts-ignore
                    await adapterStatusService.outputRequests(request);
                }
            }

            //This is required to ensure we don't navigate to an incorrect page based on stale state values
            relevantState = this.getConditionEvaluationContext(this.model, savedState);

            return this.proceed(request, h, relevantState);

        };
    }


}
