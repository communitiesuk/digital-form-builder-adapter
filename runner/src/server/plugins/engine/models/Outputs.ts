import {
    EmailOutputConfiguration,
    NotifyOutputConfiguration,
    OutputType,
    WebhookOutputConfiguration,
} from "@xgovformbuilder/model";
import {WebhookData} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/models/types";
import {
    OutputData
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/models/submission/types";
import {AdapterFormModel} from "./AdapterFormModel";
import {FormSubmissionState} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {WebhookModel} from "./WebhookModel";
import {
    EmailModel,
    NotifyModel
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/models/submission";

export class Outputs {
    webhookData: WebhookData;
    outputs: (OutputData | unknown)[];

    constructor(model: AdapterFormModel, state: FormSubmissionState) {
        this.webhookData = WebhookModel(model, state);

        const outputDefs = model.def.outputs;
        this.outputs = outputDefs.map((output) => {
            switch (output.type) {
                case "notify":
                    // @ts-ignore
                    /**
                     * Typescript does not support nested type discrimination {@link https://github.com/microsoft/TypeScript/issues/18758}
                     */
                    const notifyOutputConfiguration = output.outputConfiguration as NotifyOutputConfiguration;
                    return {
                        type: OutputType.Notify,
                        outputData: NotifyModel(model, notifyOutputConfiguration, state),
                    };
                case "email":
                    const emailOutputConfiguration = output.outputConfiguration as EmailOutputConfiguration;
                    return {
                        type: OutputType.Email,
                        outputData: EmailModel(
                            model,
                            emailOutputConfiguration,
                            this.webhookData
                        ),
                    };
                case "webhook":
                    const webhookOutputConfiguration = output.outputConfiguration as WebhookOutputConfiguration;
                    return {
                        type: OutputType.Webhook,
                        outputData: {
                            url: webhookOutputConfiguration.url,
                            sendAdditionalPayMetadata:
                            webhookOutputConfiguration.sendAdditionalPayMetadata,
                            allowRetry: webhookOutputConfiguration.allowRetry,
                        },
                    };
                default:
                    return {} as unknown;
            }
        });
    }
}
