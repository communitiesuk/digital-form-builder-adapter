// @ts-ignore
import joi from "joi";
import {AdapterFormModel} from "../models";
import {ClientSideFileUploadFieldComponent} from "@communitiesuk/model";
import {FormSubmissionErrors} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {ClientSideFileUploadFieldViewModel} from "./types";
import {AdapterFormComponent} from "./AdapterFormComponent";
import {HapiRequest} from "../../../types";

export class ClientSideFileUploadField extends AdapterFormComponent {
    options: ClientSideFileUploadFieldComponent["options"];
    schema: ClientSideFileUploadFieldComponent["schema"];

    constructor(def: ClientSideFileUploadFieldComponent, model: AdapterFormModel) {
        //@ts-ignore
        super(def, model);
        this.options = def.options;
        this.schema = def.schema;
    }

    //@ts-ignore
    getFormSchemaKeys() {
        return {
            [this.name]: joi.allow("").allow(null),
            [`${this.name}__filename`]: joi.string().optional(),
            [`${this.name}__delete[]`]: joi.string().optional(),
        };
    }

    getAdditionalValidationFunctions(): Function[] {
        return [
            async (request: HapiRequest, viewModel) => {
                const {s3UploadService, adapterCacheService} = request.services([]);
                //@ts-ignore
                const state = await adapterCacheService.getState(request);
                let form_session_identifier = state.metadata?.form_session_identifier ?? request.query.form_session_identifier ?? "";

                const clientSideUploadComponent = viewModel.components.find(
                    (c) => c.type === "ClientSideFileUploadField"
                );

                let {id, path} = request.params as any;

                let currentPage;
                if (path === "summary") {
                    currentPage = clientSideUploadComponent.model.pages.find((page) =>
                        page.components.items.includes(clientSideUploadComponent)
                    );
                    path = currentPage.path.replace("/", "");
                }

                let componentKey = clientSideUploadComponent.model.id;
                if (!componentKey) {
                    componentKey = clientSideUploadComponent.name;
                }

                const key = `${form_session_identifier}/${id}/${path}/${componentKey}`;

                // we wait an arbitrary amount of 1 second here, because of race conditions.
                await new Promise((resolve) => setTimeout(resolve, 1000));

                const files = await s3UploadService.listFilesInBucketFolder(
                    key,
                    form_session_identifier
                );
                //@ts-ignore
                const maxFiles = this.options.dropzoneConfig.maxFiles;
                if (files.length > maxFiles) {
                    return [
                        {
                            path: currentPage
                                ? `${currentPage?.section?.name}.${componentKey}`
                                : componentKey,
                            name: componentKey,
                            href: `#${componentKey}`,
                            text:
                                maxFiles > 1
                                    ? request.i18n.__('validation.fileUpload.fileUploadCountMaxError').replace("{maxFiles}", maxFiles)
                                    : request.i18n.__('validation.fileUpload.fileUploadCountSingleError'),
                        },
                    ];
                }
                //@ts-ignore
                const hasRequiredFiles = files.length >= this.options.minimumRequiredFiles;
                if (hasRequiredFiles) {
                    return [];
                }

                const error = {
                    path: currentPage
                        ? `${currentPage?.section?.name}.${componentKey}`
                        : componentKey,
                    name: componentKey,
                    href: `#${componentKey}`,
                };

                if (this.options.minimumRequiredFiles === 1) {
                    const labelText = clientSideUploadComponent.model?.label?.text || "";
                    const fullErrorText = request.i18n.__('validation.required').replace("{#label}", labelText);
                    return [
                        {
                            ...error,
                            ...{
                                text: fullErrorText,
                            },
                        },
                    ];
                }

                const labelText = clientSideUploadComponent.model?.label?.text || "";
                const fullErrorText = request.i18n.__('validation.fileUpload.fileUploadCountMinError').replace("{labelText}", labelText).replace("{minimumRequiredFiles}", `${this.options.minimumRequiredFiles}`);
                return [
                    {
                        ...error,
                        ...{
                            text: fullErrorText,
                        },
                    },
                ];
            },
        ];
    }

    // @ts-ignore
    getViewModel(
        formData: FormData,
        errors: FormSubmissionErrors
    ): ClientSideFileUploadFieldViewModel {
        //@ts-ignore
        const isRequired = this.options.minimumRequiredFiles > 0;
        const displayOptionaltext = this.options.optionalText;
        this.options.required = isRequired;
        this.options.optionalText = !isRequired && displayOptionaltext;
        const viewModel = {
            //@ts-ignore
            ...super.getViewModel(formData, errors),
            dropzoneConfig: this.options.dropzoneConfig,
            existingFiles: [],
            pageAndForm: null,
            showNoScriptWarning: this.options.showNoScriptWarning || false,
            totalOverallFilesize: this.options.totalOverallFilesize,
            //@ts-ignore
            hideTitle: this.options.hideTitle || false,
        } as unknown as ClientSideFileUploadFieldViewModel;
        viewModel.label = {
            text: this.title,
            classes: "govuk-label--s",
        };
        return viewModel;
    }
}
