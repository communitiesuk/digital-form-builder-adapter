import {RegisterApi} from "./RegisterApi";
import {HapiRequest, HapiResponseToolkit, HapiServer} from "../../../types";
import {Options} from "../types/PluginOptions";
import {retryPay} from "../application-status/RetryPay";
import {handleUserWithConfirmationViewModel} from "../application-status/HandleUserWithConfirmationViewModel";
import {checkUserCompletedSummary} from "../application-status/CheckUserCompletedSummary";

export class RegisterApplicationStatusApi implements RegisterApi {

    //@ts-ignore
    register(server: HapiServer, options?: Options): void {

        server.route({
            method: "get",
            path: "/{id}/status",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
                pre: [
                    preHandlers.retryPay,
                    preHandlers.handleUserWithConfirmationViewModel,
                    preHandlers.checkUserCompletedSummary,
                ],
                handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                    const {adapterStatusService, adapterCacheService} = request.services([]);
                    const {params} = request;
                    //@ts-ignore
                    const form = server.app.forms[params.id];
                    //@ts-ignore
                    const state = await adapterCacheService.getState(request);
                    //@ts-ignore
                    const {reference: newReference} = await adapterStatusService.outputRequests(request);

                    if (state.callback?.skipSummary?.redirectUrl || state.callback?.returnUrl) {
                        let redirectUrl = state.callback?.skipSummary?.redirectUrl;
                        if (redirectUrl == undefined && state.callback?.returnUrl != undefined) {
                            redirectUrl = state.callback?.returnUrl;
                        }
                        request.logger.info(
                            ["applicationStatus"],
                            `Callback skipSummary detected, redirecting ${request.yar.id} 
                                to ${redirectUrl} and clearing state`
                        );
                        //@ts-ignore
                        await adapterCacheService.setConfirmationState(request, {redirectUrl,});
                        //@ts-ignore
                        return h.redirect(redirectUrl);
                    }

                    const viewModel = adapterStatusService.getViewModel(state, form, newReference);
                    //@ts-ignore
                    await adapterCacheService.setConfirmationState(request, {confirmation: viewModel,});
                    //@ts-ignore
                    await adapterCacheService.clearState(request);
                    return h.view("confirmation", viewModel);
                },
            },
        });
    }

}


export const preHandlers = {
    retryPay: {
        method: retryPay,
        assign: "shouldShowPayErrorPage",
    },
    handleUserWithConfirmationViewModel: {
        method: handleUserWithConfirmationViewModel,
        assign: "confirmationViewModel",
    },
    checkUserCompletedSummary: {
        method: checkUserCompletedSummary,
        assign: "userCompletedSummary",
    },
};
