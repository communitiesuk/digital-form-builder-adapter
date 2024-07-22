import {RegisterApi} from "./RegisterApi";
import {HapiRequest, HapiResponseToolkit, HapiServer} from "../../../types";
import {Options} from "../types/PluginOptions";
import Joi from "joi";
import {redirectTo} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine";
import {
    continueToPayAfterPaymentSkippedWarning,
    paymentSkippedWarning
} from "../../../../../../digital-form-builder/runner/src/server/plugins/applicationStatus/paymentSkippedWarning";
import {retryPay} from "../../../../../../digital-form-builder/runner/src/server/plugins/applicationStatus/retryPay";
import {
    handleUserWithConfirmationViewModel
} from "../../../../../../digital-form-builder/runner/src/server/plugins/applicationStatus/handleUserWithConfirmationViewModel";
import {
    checkUserCompletedSummary
} from "../../../../../../digital-form-builder/runner/src/server/plugins/applicationStatus/checkUserCompletedSummary";

export class RegisterApplicationStatusApi implements RegisterApi {

    //@ts-ignore
    register(server: HapiServer, options?: Options): void {

        server.route({
            method: "post",
            path: "/{id}/status",
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {payService, cacheService} = request.services([]);
                //@ts-ignore
                const {pay} = await cacheService.getState(request);
                const {meta} = pay;
                meta.attempts++;
                const res = await payService.payRequestFromMeta(meta);
                //@ts-ignore
                await cacheService.mergeState(request, {
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
