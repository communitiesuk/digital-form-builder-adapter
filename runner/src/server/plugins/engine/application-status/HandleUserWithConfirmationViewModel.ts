import {HapiRequest, HapiResponseToolkit} from "../../../types";


export async function handleUserWithConfirmationViewModel(request: HapiRequest, h: HapiResponseToolkit) {
    const {adapterCacheService} = request.services([]);
    //@ts-ignore
    const confirmationViewModel = await adapterCacheService.getConfirmationState(request);

    if (!confirmationViewModel) {
        return null;
    }

    const {redirectUrl, confirmation} = confirmationViewModel;

    if (redirectUrl) {
        request.logger.info(
            [`/${request.params.id}/status`, request.yar.id],
            `confirmationViewModel.redirect detected. User will be redirected to ${redirectUrl}`
        );
        return h.redirect(redirectUrl).takeover();
    }

    if (confirmation) {
        request.logger.info(
            [`/${request.params.id}/status`, request.yar.id],
            `confirmationViewModel.confirmation detected. Re-presenting ${confirmation}`
        );
        return h.view("confirmation", confirmation).takeover();
    }

    return null;
}
