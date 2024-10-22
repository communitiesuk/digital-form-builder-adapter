import {StatusService} from "../../../../digital-form-builder/runner/src/server/services";
import {AdapterCacheService} from "./AdapterCacheService";
import {HapiRequest, HapiServer} from "../types";
import Boom from "boom";
import {WebhookService} from "./WebhookService";


export class AdapterStatusService extends StatusService {


    cacheService: AdapterCacheService;
    webhookService: WebhookService;

    constructor(server: HapiServer) {
        //@ts-ignore
        super(server);
        const {adapterCacheService, webhookService} = server.services([]);
        this.webhookService = webhookService;
        this.cacheService = adapterCacheService;
    }

    //@ts-ignore
    async outputRequests(request: HapiRequest) {
        //@ts-ignore
        const state = await this.cacheService.getState(request);
        let formData = this.webhookArgsFromState(state);

        const {outputs, callback} = state;

        let newReference;

        if (callback) {
            this.logger.info(
                ["StatusService", "outputRequests"],
                `Callback detected for ${request.yar.id} - PUT to ${callback.callbackUrl}`
            );
            try {
                newReference = await this.webhookService.postRequest(
                    callback.callbackUrl,
                    formData,
                    "PUT"
                );
            } catch (e) {
                // @ts-ignore
                throw Boom.badRequest(e);
            }
        }

        const firstWebhook = outputs?.find((output) => output.type === "webhook");
        const otherOutputs = outputs?.filter((output) => output !== firstWebhook);
        if (firstWebhook) {
            newReference = await this.webhookService.postRequest(
                firstWebhook.outputData.url,
                {...formData},
                "POST",
                firstWebhook.outputData.sendAdditionalPayMetadata
            );
            //@ts-ignore
            await this.cacheService.mergeState(request, {
                reference: newReference,
            });
        }

        const {notify = [], webhook = []} = this.outputArgs(
            otherOutputs,
            formData,
            newReference ? newReference.reference : newReference,
            state.pay
        );

        const requests = [
            ...notify.map((args) => this.notifyService.sendNotification(args)),
            ...webhook.map(({url, sendAdditionalPayMetadata, formData}) =>
                this.webhookService.postRequest(
                    url,
                    {
                        ...formData,
                    },
                    "POST",
                    sendAdditionalPayMetadata
                )
            ),
        ];

        return {
            reference: newReference ? newReference.reference : newReference,
            results: Promise.allSettled(requests),
            statusCode: newReference ? newReference.statusCode : undefined,
        };
    }
}
