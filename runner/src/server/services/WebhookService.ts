import {HapiServer} from "../types";
import {post, put} from "../../../../digital-form-builder/runner/src/server/services/httpService";

const DEFAULT_OPTIONS = {
    headers: {
        accept: "application/json",
        "content-type": "application/json",
    },
    timeout: 60000,
};

export class WebhookService {
    logger: any;

    constructor(server: HapiServer) {
        this.logger = server.logger;
    }

    /**
     * Posts data to a webhook
     * @param url - url of the webhook
     * @param data - object to send to the webhook
     * @param method - POST or PUT request, defaults to POST
     * @param sendAdditionalPayMetadata - whether to include additional metadata in the request
     * @returns object with the property `reference` webhook if the response returns with a reference number. If the call fails, the reference will be 'UNKNOWN'.
     */
    async postRequest(
        url: string,
        data: object,
        method: "POST" | "PUT" = "POST",
        sendAdditionalPayMetadata: boolean = false
    ) {
        this.logger.info(
            ["WebhookService", "postRequest body"],
            JSON.stringify(data)
        );
        let request = method === "POST" ? post : put;
        try {
            if (!sendAdditionalPayMetadata) {
                // @ts-ignore
                delete data?.metadata?.pay;
            }
            const response = await request(url, {
                ...DEFAULT_OPTIONS,
                payload: JSON.stringify(data),
            });

            const {payload} = response;
            const {statusCode} = response.res;

            if (statusCode === 301 || statusCode === 302) {
                return {
                    isRedirect: true,
                    statusCode: statusCode
                };
            }

            if (typeof payload === "object" && !Buffer.isBuffer(payload)) {
                return {reference: payload.reference, statusCode: statusCode};
            }
            const {reference} = JSON.parse(payload);
            this.logger.info(
                ["WebhookService", "postRequest"],
                `Webhook request to ${url} submitted OK`
            );
            this.logger.debug(
                ["WebhookService", "postRequest", `REF: ${reference}`],
                JSON.stringify(payload)
            );
            return {reference: reference, statusCode: statusCode};
        } catch (error) {
            this.logger.error(["WebhookService", "postRequest"], error);
            return "UNKNOWN";
        }
    }
}
