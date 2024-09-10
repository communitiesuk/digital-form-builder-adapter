import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {AdapterFormModel} from "../models";
import {AdapterSummaryViewModel} from "../models";
import {PageController} from "./PageController";
import {FormSubmissionState} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {
    SummaryPageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";

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
            if (!returnUrl) {
                // We have overridden this because when we create an AdapterSummaryViewModel it tries
                // to verify that all the conditions are met for an entire form journey,
                // not to the point that we are in
                model.getRelevantPages = this.retrievePagesUpToCurrent
            }
            //@ts-ignore
            const summaryViewModel = new AdapterSummaryViewModel(this.title, model, state, request, this);
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
                //@ts-ignore
                await adapterStatusService.outputRequests(request);
            }

            //This is required to ensure we don't navigate to an incorrect page based on stale state values
            relevantState = this.getConditionEvaluationContext(this.model, savedState);

            return this.proceed(request, h, relevantState);

        };
    }

    /**
     * In this method, it will get all the pages up to the current page & return the list of pages
     * @param state
     */
    retrievePagesUpToCurrent = (state: FormSubmissionState) => {
        let nextPage = this.model.startPage;
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
            if (nextPage.path === this.path) {
                nextPage = null;
            } else {
                nextPage = nextPage.getNextPage(state, true);
            }
        }

        return {relevantPages, endPage};
    }
}
