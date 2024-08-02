import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {AdapterFormModel} from "../models";


export async function retryPay(request: HapiRequest, h: HapiResponseToolkit) {
    const {adapterStatusService} = request.services([]);
    //@ts-ignore
    const shouldShowPayErrorPage = await adapterStatusService.shouldShowPayErrorPage(request);
    //@ts-ignore
    const form: AdapterFormModel = request.server.app.forms[request.params.id];
    const feeOptions = form.feeOptions;
    const {allowSubmissionWithoutPayment = true, customPayErrorMessage,} = feeOptions;
    if (shouldShowPayErrorPage) {
        return h.view("pay-error", {
            errorList: ["there was a problem with your payment"],
            allowSubmissionWithoutPayment,
            customPayErrorMessage,
        }).takeover();
    }
    return shouldShowPayErrorPage;
}
