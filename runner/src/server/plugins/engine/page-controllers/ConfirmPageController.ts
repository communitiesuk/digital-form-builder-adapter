import { HapiRequest, HapiResponseToolkit } from "../../../types";
import { redirectTo } from "../../../../../../digital-form-builder/runner/src/server/plugins/engine";
import config from "../../../../../../digital-form-builder/runner/src/server/config";
import {
    SummaryPageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";

export class ConfirmPageController extends SummaryPageController {
    // Controller to add confirm and continue button
    // @ts-ignore
    summary: ConfirmPageController;

    makePostRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            const { cacheService } = request.services([]);
            //@ts-ignore
            const state = await cacheService.getState(request);
            const fund_name = state["metadata"]["fund_name"];
            const round_name = state["metadata"]["round_name"];
            return redirectTo(
                request,
                h,
                config.eligibilityResultUrl + "/" + fund_name + "/" + round_name
            );
        };
    }
}
