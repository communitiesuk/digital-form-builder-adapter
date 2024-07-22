import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {preHandlers, RegisterApplicationStatusApi} from "../api/RegisterApplicationStatusApi";


const index = {
    plugin: {
        name: "applicationStatus",
        dependencies: "@hapi/vision",
        multiple: true,
        register: (server) => {
            server.route({
                method: "get",
                path: "/{id}/status",
                options: {
                    pre: [
                        preHandlers.retryPay,
                        preHandlers.handleUserWithConfirmationViewModel,
                        preHandlers.checkUserCompletedSummary,
                    ],
                    handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                        const {statusService, cacheService} = request.services([]);
                        const {params} = request;
                        const form = server.app.forms[params.id];
                        //@ts-ignore
                        const state = await cacheService.getState(request);
                        //@ts-ignore
                        const {reference: newReference} = await statusService.outputRequests(request);

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
                            await cacheService.setConfirmationState(request, {redirectUrl,});
                            //@ts-ignore
                            await cacheService.clearState(request);

                            return h.redirect(redirectUrl);
                        }

                        const viewModel = statusService.getViewModel(state, form, newReference);
                        //@ts-ignore
                        await cacheService.setConfirmationState(request, {confirmation: viewModel,});
                        //@ts-ignore
                        await cacheService.clearState(request);
                        return h.view("confirmation", viewModel);
                    },
                },
            });

            new RegisterApplicationStatusApi().register(server)
        },
    },
};

export default index;
