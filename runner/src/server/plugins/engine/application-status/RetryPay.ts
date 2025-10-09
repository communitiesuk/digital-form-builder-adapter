import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {AdapterFormModel} from "../models";
import {getNamespaceFromRequest} from "../../../services/AdapterCacheService";


export async function retryPay(request: HapiRequest, h: HapiResponseToolkit) {
    const {adapterStatusService, adapterCacheService} = request.services([]);
    //@ts-ignore
    const shouldShowPayErrorPage = await adapterStatusService.shouldShowPayErrorPage(request);
    
    // Determine namespace - payment errors can occur in both preview and permanent forms
    const namespace = getNamespaceFromRequest(request);
    //@ts-ignore
    const form: AdapterFormModel = await adapterCacheService.getFormAdapterModel(
        request.params.id, 
        request,
        namespace
    );
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
