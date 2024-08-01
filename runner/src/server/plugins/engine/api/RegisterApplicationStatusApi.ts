import {RegisterApi} from "./RegisterApi";
import {HapiRequest, HapiResponseToolkit, HapiServer} from "../../../types";
import {Options} from "../types/PluginOptions";
import Joi from "joi";
import {redirectTo} from "../util/helper";
import {retryPay} from "../application-status/RetryPay";
import {handleUserWithConfirmationViewModel} from "../application-status/HandleUserWithConfirmationViewModel";
import {checkUserCompletedSummary} from "../application-status/CheckUserCompletedSummary";
import {
    continueToPayAfterPaymentSkippedWarning,
    paymentSkippedWarning
} from "../application-status/PaymentSkippedWarning";

export class RegisterApplicationStatusApi implements RegisterApi {

    //@ts-ignore
    register(server: HapiServer, options?: Options): void {

        server.route({
            method: "post",
            path: "/{id}/status",
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {payService, adapterCacheService} = request.services([]);
                //@ts-ignore
                const {pay} = await adapterCacheService.getState(request);
                const {meta} = pay;
                meta.attempts++;
                const res = await payService.payRequestFromMeta(meta);
                //@ts-ignore
                await adapterCacheService.mergeState(request, {
                    webhookData: {
                        fees: {
                            paymentReference: res.reference,
                        },
                    },
                    pay: {
                        payId: res.payment_id,
                        reference: res.reference,
                        self: res._links.self.href,
                        meta,
                    },
                });
                return redirectTo(request, h, res._links.next_url.href);
            },
        });

        server.route({
            method: "get",
            path: "/{id}/status/payment-skip-warning",
            options: {
                pre: [preHandlers.checkUserCompletedSummary],
                handler: paymentSkippedWarning,
            },
        });

        server.route({
            method: "post",
            path: "/{id}/status/payment-skip-warning",
            options: {
                handler: continueToPayAfterPaymentSkippedWarning,
                validate: {
                    payload: Joi.object({
                        action: Joi.string().valid("pay").required(),
                        crumb: Joi.string(),
                    }),
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
