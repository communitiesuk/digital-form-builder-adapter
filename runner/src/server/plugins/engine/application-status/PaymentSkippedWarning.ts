import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {AdapterFormModel} from "../models/AdapterFormModel";


export async function paymentSkippedWarning(
    request: HapiRequest,
    h: HapiResponseToolkit
) {
    //@ts-ignore
    const form: AdapterFormModel = request.server.app.forms[request.params.id];
    const {allowSubmissionWithoutPayment} = form.feeOptions;

    if (allowSubmissionWithoutPayment) {
        const {customText} = form.specialPages?.paymentSkippedWarningPage ?? {};
        return h
            .view("payment-skip-warning", {
                customText,
                backLink: "./../summary",
            })
            .takeover();
    }

    return h.redirect(`${request.params.id}/status`);
}

export async function continueToPayAfterPaymentSkippedWarning(
    request: HapiRequest,
    h: HapiResponseToolkit
) {
    const {adapterCacheService} = request.services([]);
    //@ts-ignore
    const state = await adapterCacheService.getState(request);

    const payState = state.pay;
    payState.meta++;
    //@ts-ignore
    await adapterCacheService.mergeState(request, payState);

    const payRedirectUrl = payState.next_url;
    return h.redirect(payRedirectUrl);
}
