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

            let question_answer_short_code;

            // get the question_answer_short_code (round shortname to redirect to) if it was included in the funds eligibility questions
            for (let [, section] of Object.entries(state)) {
                if (section && section["redirectToEligibleRound"]) {
                    question_answer_short_code = section["redirectToEligibleRound"];
                }
            }

            const url = new URL(`${config.eligibilityResultUrl}/${fund_name}/${round_name}`)

            if (question_answer_short_code) {
                url.searchParams.set('redirect_to_eligible_round', question_answer_short_code)
            }

            return redirectTo(request, h, url.href)
        };
    }
}
