import { clone } from "hoek";
import { FormSubmissionState } from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {
    FeesModel
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/models/submission";
import { ViewModel } from "./ViewModel";
import { HapiRequest } from "../../../types";
import { AdapterFormModel } from "./AdapterFormModel";
import { redirectUrl } from "../../../../../../digital-form-builder/runner/src/server/plugins/engine";
import { WebhookModel } from "./submisions/WebhookModel";

/**
 * TODO - extract submission behaviour dependencies from the viewmodel
 * skipSummary (replace with reference to this.def.skipSummary?)
 * _payApiKey
 * replace result with errors?
 * remove state and value?
 *
 * TODO - Pull out summary behaviours into separate service classes?
 */

export class SummaryViewModel extends ViewModel {
    /**
     * Responsible for parsing state values to the govuk-frontend summary list template and parsing data for outputs
     * The plain object is also used to generate data for outputs
     */

    constructor(
        pageTitle: string,
        model: AdapterFormModel,
        state: FormSubmissionState,
        request: HapiRequest
    ) {
        super(pageTitle, model, state, request);

        const { relevantPages } = SummaryViewModel.getRelevantPages(model, state);
        const details = this.summaryDetails(request, model, state, relevantPages);

        const schema = model.makeFilteredSchema(state, relevantPages);
        const collatedRepeatPagesState = gatherRepeatPages(state);

        const result = schema.validate(collatedRepeatPagesState, {
            abortEarly: false,
            stripUnknown: true
        });

        if (result.error) {
            this.processErrors(result, details);
        } else {
            this.fees = FeesModel(model, state);
            this._webhookData = WebhookModel(
                relevantPages,
                details,
                // @ts-ignore
                model,
                this.fees
            );
            this._webhookData = this.addFeedbackSourceDataToWebhook(
                this._webhookData,
                model,
                request
            );
        }
        this.result = result;
        this.value = result.value;
        this.name = model.name;
        this.markAsCompleteComponent = state.callback?.markAsCompleteComponent;
        this.markAsComplete = state.markAsComplete;
    }

    backLink?: string;

    private processErrors(result, details) {
        this.errors = result.error.details.map((err) => {
            const name = err.path[err.path.length - 1];

            return {
                path: err.path.join("."),
                name: name,
                message: err.message
            };
        });

        details.forEach((detail) => {
            const sectionErr = this.errors?.find((err) => err.path === detail.name);

            detail.items.forEach((item) => {
                if (sectionErr) {
                    item.inError = true;
                    return;
                }

                const err = this.errors?.find(
                    (err) =>
                        err.path ===
                        (detail.name ? detail.name + "." + item.name : item.name)
                );
                if (err) {
                    item.inError = true;
                }
            });
        });
    }
}

function gatherRepeatPages(state) {
    if (!!Object.values(state).find((section) => Array.isArray(section))) {
        return state;
    }
    const clonedState = clone(state);
    Object.entries(state).forEach(([key, section]) => {
        if (key === "progress") {
            return;
        }
        if (Array.isArray(section)) {
            clonedState[key] = section.map((pages) =>
                Object.values(pages).reduce((acc: {}, p: any) => ({ ...acc, ...p }), {})
            );
        }
    });
}

/**
 * Creates an Item object for Details
 */
// @ts-ignore
function Item(
    request,
    component,
    sectionState,
    page,
    model: AdapterFormModel,
    params: { num?: number; returnUrl: string } = {
        returnUrl: redirectUrl(request, `/${model.basePath}/summary`)
    }
) {
    const isRepeatable = !!page.repeatField;

    //TODO:- deprecate in favour of section based and/or repeatingFieldPageController
    if (isRepeatable && Array.isArray(sectionState)) {
        return sectionState.map((state, i) => {
            const collated = Object.values(state).reduce(
                (acc: {}, p: any) => ({ ...acc, ...p }),
                {}
            );
            return Item(request, component, collated, page, model, {
                ...params,
                num: i + 1
            });
        });
    }

    return {
        name: component.name,
        path: page.path,
        label: component.localisedString(component.title),
        value: component.getDisplayStringFromState(sectionState),
        rawValue: sectionState[component.name],
        url: redirectUrl(request, `/${model.basePath}${page.path}`, params),
        pageId: `/${model.basePath}${page.path}`,
        type: component.type,
        title: component.title,
        dataType: component.dataType
    };
}
