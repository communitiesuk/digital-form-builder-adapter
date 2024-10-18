import {RegisterApi} from "./RegisterApi";
import {HapiServer} from "../../../types";
import {
    callbackValidation, generateSessionTokenForForm,
    verifyToken, webhookToSessionData
} from "../../../../../../digital-form-builder/runner/src/server/plugins/initialiseSession/helpers";
import Boom from "boom";
import path from "path";
import Jwt from "@hapi/jwt";
import {Options} from "../types/PluginOptions";
import {SpecialPages} from "@xgovformbuilder/model";
import {
    InitialiseSessionOptions
} from "../../../../../../digital-form-builder/runner/src/server/plugins/initialiseSession/types";
import {WebhookSchema} from "../../../../../../digital-form-builder/runner/src/server/schemas/types";
import {Request} from "@hapi/hapi";

type ConfirmationPage = SpecialPages["confirmationPage"];

type InitialiseSessionRequest = {
    params: {
        formId: string;
    };
    payload: {
        options: InitialiseSessionOptions & ConfirmationPage;
    } & WebhookSchema;
} & Request;

export class RegisterSessionApi implements RegisterApi {
    register(server: HapiServer, pluginOptions: Options): void {

        server.route({
            method: "GET",
            path: "/session/{token}",
            handler: async function (request, h) {
                const {adapterCacheService} = request.services([]);
                const {token} = request.params;
                const tokenArtifacts = Jwt.token.decode(token);
                const {isValid, error} = verifyToken(tokenArtifacts);

                if (!isValid) {
                    request.logger.error([`GET /session/${token}`, "invalid JWT"], error);
                    throw Boom.badRequest();
                }

                const {payload} = tokenArtifacts.decoded;
                const {redirectPath} = await adapterCacheService.activateSession(
                    token,
                    request
                );
                const redirect = path
                    .join("/", payload.group, redirectPath)
                    .normalize();

                return h.redirect(redirect);
            },
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
            },
        });

        server.route({
            method: "POST",
            path: "/session/{formId}",
            options: {
                description: "See API-README.md file in the runner/src/server/plugins/engine/api",
                plugins: {
                    crumb: false,
                },
            },
            handler: async function (request, h) {
                const {payload, params} = request as InitialiseSessionRequest;
                const {adapterCacheService} = request.services([]);
                const {formId} = params;
                // @ts-ignore
                const {options, metadata = {}, ...webhookData} = payload;
                const {callbackUrl} = options;

                //@ts-ignore
                const isExistingForm = await adapterCacheService.getFormAdapterModel(formId, request) ?? false;
                const {error: callbackSafeListError} = callbackValidation(pluginOptions.safelist).validate(callbackUrl, {abortEarly: false,});

                if (!isExistingForm) {
                    request.logger.warn(
                        [`/session/${formId}`, "POST"],
                        `${formId} does not exist`
                    );
                    return h
                        .response({message: `${formId} does not exist on this instance`})
                        .code(404);
                }

                if (callbackSafeListError) {
                    request.logger.warn(
                        [`/session/${formId}`, "POST"],
                        `${callbackUrl} was was not allowed. only ${pluginOptions.safelist?.join(", ")}`
                    );
                    return h
                        .response({
                            message: `the callback URL provided ${callbackUrl} is not allowed.`,
                        })
                        .code(403);
                }

                if (options.htmlMessage && options.message) {
                    return h
                        .response({
                            message:
                                "Both htmlMessage and message were provided. Only one is allowed.",
                        })
                        .code(400);
                }

                const token = generateSessionTokenForForm(callbackUrl, formId);

                await adapterCacheService.createSession(token, {
                    callback: options,
                    metadata,
                    ...webhookToSessionData(webhookData),
                });

                return h.response({token}).code(201);
            },
        });

    }
}
