import {RegisterApi} from "./RegisterApi";
import {HapiRequest, HapiResponseToolkit, HapiServer} from "../../../types";
import {Options} from "../types/PluginOptions";
import {retryPay} from "../application-status/RetryPay";
import {handleUserWithConfirmationViewModel} from "../application-status/HandleUserWithConfirmationViewModel";
import {checkUserCompletedSummary} from "../application-status/CheckUserCompletedSummary";
import {config} from "../../utils/AdapterConfigurationSchema";

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
                    const form = await adapterCacheService.getFormAdapterModel(params.id, request);
                    //@ts-ignore
                    const state = await adapterCacheService.getState(request);
                    //@ts-ignore
                    const response = await adapterStatusService.outputRequests(request);
                    const {reference: newReference} = response
                    const {statusCode} = response

                    if ((statusCode === 301 || statusCode === 302) && state.metadata && state.metadata.round_close_notification_url) {
                        return h.redirect(state.metadata.round_close_notification_url);
                    }

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

                    /*
                    * If non-prod environment, show confirmation page
                    * If prod environment, show 500 page
                    * The behaviour is not changing for non-prod environments
                    */
                    if (["dev", "test", "uat", ""].includes(config.copilotEnv)) {
                        // you are previewing the form
                        request.logger.info(
                            ["applicationStatus"],
                            `Showing confirmation page ${request.yar.id} - You are in preview mode`
                        );

                        return h.view("confirmation", viewModel);
                    }

                    // if you are here the session dropped
                    request.logger.error(
                        ["applicationStatus"],
                        `Showing 500 page ${request.yar.id} - session dropped`
                    );

                    return h.view("500", viewModel);
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
