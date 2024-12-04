import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {config} from "../../utils/AdapterConfigurationSchema";
import {redirectTo} from "../util/helper";
import {AdapterFormModel} from "../models";
import {SummaryPageController} from "./SummaryPageController";

const REDIRECT_TO_ELIGIBLE_ROUND_QUESTION_KEY = "redirectToEligibleRound";

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

            let eligibleRoundRedirectAnswerShortCode;

            // get the eligibleRoundRedirectAnswerShortCode (round to redirect to) if it was included in the funds eligibility questions
            for (let [, section] of Object.entries(state)) {
                if (section && section[REDIRECT_TO_ELIGIBLE_ROUND_QUESTION_KEY]) {
                    eligibleRoundRedirectAnswerShortCode = section[REDIRECT_TO_ELIGIBLE_ROUND_QUESTION_KEY];
                }
            }

            const url = new URL(`${config.eligibilityResultUrl}/${fund_name}/${round_name}`)

            if (eligibleRoundRedirectAnswerShortCode) {
                url.searchParams.set('redirect_to_eligible_round', eligibleRoundRedirectAnswerShortCode)
            }

            return redirectTo(request, h, url.href)
        };
    }
}
