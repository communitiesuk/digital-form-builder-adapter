import {PageController} from "./PageController";
import {AdapterFormComponent} from "../components";
import {AdapterPage} from "@communitiesuk/model";
// @ts-ignore
import joi from "joi";
import {FormSubmissionErrors} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {AdapterFormModel} from "../models";
import {validationOptions} from "./ValidationOptions";

export class PlaybackUploadPageController extends PageController {
    inputComponent: AdapterFormComponent;
    retryUploadViewModel = {
        name: "retryUpload",
        type: "RadiosField",
        options: {},
        schema: {},
        fieldset: {
            legend: {
                text: "Would you like to upload a new image?",
                isPageHeading: false,
                classes: "govuk-fieldset__legend--s",
            },
        },
        items: [
            {
                value: true,
                text: "Yes - I would like to upload a new image",
            },
            {
                value: false,
                text: "No - I'm happy with the image",
            },
        ],
    };

    constructor(model: AdapterFormModel, pageDef: AdapterPage, inputComponent: AdapterFormComponent) {
        super(model, pageDef);
        this.inputComponent = inputComponent;
        this.formSchema = joi.object({
            crumb: joi.string(),
            retryUpload: joi
                .string()
                .required()
                .allow("true", "false")
                .label("if you would like to upload a new image"),
        });
    }

    /**
     * Gets the radio button view model for the "Would you like to upload a new image?" question
     * @param error - if the user hasn't chosen an option and tries to continue, add the required field error to the field
     * @returns the view model for the radio button component
     * */
    getRetryUploadViewModel(errors?: FormSubmissionErrors) {
        let viewModel = {...this.retryUploadViewModel};
        errors?.errorList?.forEach((err) => {
            if (err.name === viewModel.name) {
                //@ts-ignore
                viewModel.errorMessage = {
                    text: err.text,
                };
            }
        });
        return viewModel;
    }

    makeGetRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            const {adapterCacheService} = request.services([]);
            //@ts-ignore
            const state = await adapterCacheService.getState(request);
            const {progress = []} = state;
            let sectionTitle = this.section?.title;
            return h.view("upload-playback", {
                sectionTitle: sectionTitle,
                showTitle: true,
                pageTitle: "Check your image",
                backLink: progress[progress.length - 1] ?? this.backLinkFallback,
                radios: this.getRetryUploadViewModel(),
            });
        };
    }

    makePostRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            const {adapterCacheService} = request.services([]);
            //@ts-ignore
            const state = await adapterCacheService.getState(request);
            const {progress = []} = state;
            const {payload} = request;
            const result = this.formSchema.validate(payload, validationOptions(request));
            if (result.error) {
                const errors = this.getErrors(result, request);
                let sectionTitle = this.section?.title;
                return h.view("upload-playback", {
                    sectionTitle: sectionTitle,
                    showTitle: true,
                    pageTitle: "Check your image",
                    uploadErrors: errors,
                    backLink: progress[progress.length - 2] ?? this.backLinkFallback,
                    radios: this.getRetryUploadViewModel(errors),
                });
            }
            //@ts-ignore
            if (payload.retryUpload === "true") {
                return h.redirect(`/${this.model.basePath}${this.path}`);
            }

            return h.redirect(this.getNext(request.payload));
        };
    }
}
