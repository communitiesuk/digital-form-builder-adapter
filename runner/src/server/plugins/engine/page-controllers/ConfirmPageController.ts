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
            let round_name = state["metadata"]["round_name"];
            // if it's HSRA fund, get the value of a question from the eligibility form to determine the round
            if(fund_name === "hsra"){
                round_name = state["mwumLN"]["OjGBLs"];
            }
            return redirectTo(request, h, `${config.eligibilityResultUrl}?fund_name=${fund_name}&round_name=${round_name}`);
        };
    }
}
