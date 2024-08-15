import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {AdapterFormModel} from "../models";
import {AdapterSummaryViewModel} from "../models";
import {PageController} from "./PageController";

export class DefaultPageController extends PageController {

    constructor(model: AdapterFormModel, pageDef: any) {
        //@ts-ignore
        super(model, pageDef);
    }

    makePostRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            const response = await this.handlePostRequest(request, h);
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

            const startPage = this.model.def.startPage;
            const isStartPage = this.path === startPage;

            if (!isStartPage && state.metadata && state.webhookData) {
                //@ts-ignore
                await adapterStatusService.outputRequests(request);
            }

            //This is required to ensure we don't navigate to an incorrect page based on stale state values
            relevantState = this.getConditionEvaluationContext(this.model, savedState);

            return this.proceed(request, h, relevantState);

        };
    }
}
