import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {AdapterFormModel} from "../models/AdapterFormModel";
import {AdapterSummaryViewModel} from "../models/AdapterSummaryViewModel";
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
            const {cacheService, statusService} = request.services([]);
            //@ts-ignore
            const state = await cacheService.getState(request);
            if (state.metadata) {
                state.metadata.isSummaryPageSubmit = false;
            }
            const model = this.model;
            //@ts-ignore
            const summaryViewModel = new AdapterSummaryViewModel(this.title, model, state, request);
            //@ts-ignore
            const savedState = await cacheService.getState(request);
            //This is required to ensure we don't navigate to an incorrect page based on stale state values
            let relevantState = this.getConditionEvaluationContext(this.model, savedState);
            //@ts-ignore
            await cacheService.mergeState(request, {webhookData: summaryViewModel.validatedWebhookData,});

            const startPage = this.model.def.startPage;
            const isStartPage = this.path === startPage;

            if (!isStartPage && state.metadata && state.metadata.webhookData) {
                //@ts-ignore
                await statusService.outputRequests(request);
            }

            return this.proceed(request, h, relevantState);
        };
    }
}
