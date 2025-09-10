import {ServerRoute} from "@hapi/hapi";
import {AdapterSchema} from "@communitiesuk/model";
import {publish} from "../../../../digital-form-builder/designer/server/lib/publish";
import {preAwardApiClient} from "../../lib/preAwardApiClient";
import config from "../../config";


export const putFormWithIdRouteRegister: ServerRoute = {
    // SAVE DATA
    method: "PUT",
    path: "/api/{id}/data",
    options: {
        payload: {
            parse: true,
        },
        handler: async (request, h) => {
            const {id} = request.params;
            //@ts-ignore
            const {persistenceService} = request.services([]);

            try {
                const {value, error} = AdapterSchema.validate(request.payload, {
                    abortEarly: false,
                });

                if (error) {
                    //@ts-ignore
                    request.logger.error(["error", `/api/${id}/data`], [error, request.payload]);

                    throw new Error("Schema validation failed, reason: " + error.message);
                }
                await persistenceService.uploadConfiguration(
                    `${id}`,
                    JSON.stringify(value)
                );
                if (config.usePreAwardApi) {
                    const formWithName = { ...value, name: id};
                    await preAwardApiClient.createOrUpdateForm(id, formWithName);
                } else {
                    await publish(id, value);
                }
                return h.response({ok: true}).code(204);
            } catch (err) {
                //@ts-ignore
                request.logger.error("Designer Server PUT /api/{id}/data error:", err);
                const errorSummary = {
                    id: id,
                    payload: request.payload,
                    //@ts-ignore
                    errorMessage: err.message,
                    //@ts-ignore
                    error: err.stack,
                };
                request.yar.set(`error-summary-${id}`, errorSummary);
                return h.response({ok: false, err}).code(401);
            }
        },
    },
};
