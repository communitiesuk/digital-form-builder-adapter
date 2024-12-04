import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {config} from "../../utils/AdapterConfigurationSchema";
import {redirectTo} from "../util/helper";
import {AdapterFormModel} from "../models";
import {SummaryPageController} from "./SummaryPageController";

export class ConfirmPageController extends SummaryPageController {
    // Controller to add confirm and continue button
    // @ts-ignore
    summary: ConfirmPageController;

    constructor(model: AdapterFormModel, pageDef: any) {
        //@ts-ignore
        super(model, pageDef);
    }

    makePostRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            const {adapterCacheService} = request.services([]);
            //@ts-ignore
            const state = await adapterCacheService.getState(request);
            const fund_name = state["metadata"]["fund_name"];
            const round_name = state["metadata"]["round_name"];
            return redirectTo(request, h, config.eligibilityResultUrl + "/" + fund_name + "/" + round_name);
        };
    }
}
