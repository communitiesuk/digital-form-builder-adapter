import {ServerRoute} from "@hapi/hapi";
import {AdapterSchema} from "@communitiesuk/model";
import {publish} from "../../../../digital-form-builder/designer/server/lib/publish";
import {preAwardApiClient} from "../../lib/preAwardApiClient";


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
            const payload = request.payload as any;
            //@ts-ignore
            const {persistenceService} = request.services([]);

            try {
                const displayName = payload.name || id;
                const cleanPayload = { ...payload };
                delete cleanPayload.name;

                const {value, error} = AdapterSchema.validate(cleanPayload, {
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
                // Save to Pre-Award API
                const formData = { url_path: id, display_name: displayName, form_json: value };
                await preAwardApiClient.createOrUpdateForm(formData);
                // Publish to runner for preview
                await publish(id, value);
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
