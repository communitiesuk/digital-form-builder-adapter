import {clone, reach} from "hoek";
import {FeesModel} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/models/submission";
import {
    FEEDBACK_CONTEXT_ITEMS,
    WebhookData
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/models/types";
import {AdapterInitialiseSessionOptions} from "../../initialize-session/types";
import {AdapterFormModel} from "./AdapterFormModel";
import {FormSubmissionState} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {HapiRequest} from "../../../types";
import {config} from "../../utils/AdapterConfigurationSchema";
import {Outputs} from "./Outputs";
import {webhookSchema} from "../../../../../../digital-form-builder/runner/src/server/schemas/webhookSchema";
import {
    decodeFeedbackContextInfo,
    redirectUrl
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine";
import {feedbackReturnInfoKey} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/helpers";
import {AdapterFormDefinition} from "@communitiesuk/model";

const LOGGER_DATA = {
    class: "ViewModelBase",
}

/**
 * TODO - extract submission behaviour dependencies from the viewmodel
 * skipSummary (replace with reference to this.def.skipSummary?)
 * _payApiKey
 * replace result with errors?
 * remove state and value?
 *
 * TODO - Pull out summary behaviours into separate service classes?
 */

export class ViewModelBase {
    /**
     * Responsible for parsing state values to the govuk-frontend summary list template and parsing data for outputs
     * The plain object is also used to generate data for outputs
     */

    pageTitle: string;
    declaration: any; // TODO
    skipSummary: boolean;
    endPage: any; // TODO
    result: any;
    details: any;
    state: any;
    value: any;
    fees: FeesModel | undefined;
    name: string | undefined;
    feedbackLink: string | undefined;
    phaseTag: string | undefined;
    declarationError: any; // TODO
    errors:
        | {
        path: string;
        name: string;
        message: string;
    }[]
        | undefined;

    _outputs: any; // TODO
    _webhookData: WebhookData | undefined;
    callback?: AdapterInitialiseSessionOptions;
    showPaymentSkippedWarningPage: boolean = false;

    constructor(
        pageTitle: string,
        model: AdapterFormModel,
        state: FormSubmissionState,
        request: HapiRequest,
        isSavePerPageMode?: boolean,
        validateStateTillGivenPath?: string
    ) {
        this.pageTitle = pageTitle;
        let {relevantPages, endPage} = model.getRelevantPages(state);
        if (validateStateTillGivenPath) {
            const {
                relevantPagesForCurrent,
                endPageForCurrent
            } = model.retrievePagesUpToGivenPath(state, validateStateTillGivenPath);
            relevantPages = relevantPagesForCurrent;
            endPage = endPageForCurrent
        }
        const details = this.summaryDetails(request, model, state, relevantPages);
        const {def} = model;
        // @ts-ignore
        this.declaration = def.declaration;
        // @ts-ignore
        this.skipSummary = def.skipSummary;
        this.endPage = endPage;
        this.feedbackLink =
            def.feedback?.url ??
            ((def.feedback?.emailAddress && `mailto:${def.feedback?.emailAddress}`) ||
                config.feedbackLink);

        let relevantPagePaths: string[] = []
        relevantPages.forEach(page => {
            relevantPagePaths.push(page.path);
        })
        request.logger.info({
            ...LOGGER_DATA,
            message: `Number of selected pages ${relevantPages.length} pages are ${JSON.stringify(relevantPagePaths)}`
        });
        const schema = model.makeFilteredSchema(state, relevantPages);
        const collatedRepeatPagesState = gatherRepeatPages(state);

        const result = schema.validate(collatedRepeatPagesState, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (result.error) {
            request.logger.error(`[ViewModelBase] errors ${JSON.stringify(result.error)}`);
            this.processErrors(result, details);
        } else {
            this.generateWebhookData(model, state, request, def);
        }

        if (isSavePerPageMode) {
            this.generateWebhookData(model, state, request, def);
        }

        this.result = result;
        this.details = details;
        this.state = state;
        this.value = result.value;
        this.callback = state.callback;
        const {feeOptions} = model;
        this.showPaymentSkippedWarningPage =
            feeOptions.showPaymentSkippedWarningPage ?? false;
    }

    private generateWebhookData(model: AdapterFormModel, state: FormSubmissionState, request: HapiRequest, def: AdapterFormDefinition) {
        this.fees = FeesModel(model, state);
        const outputs = new Outputs(model, state);
        // TODO: move to controller
        this._webhookData = outputs.webhookData;
        request.logger.info({
            ...LOGGER_DATA,
            message: `Prepared savable data [${JSON.stringify(outputs.webhookData)}]`
        });
        this._webhookData = this.addFeedbackSourceDataToWebhook(
            this._webhookData,
            model,
            request
        );

        /**
         * If there outputs defined, parse the state data for the appropriate outputs.
         * Skip outputs if this is a callback
         */
        if (def.outputs && !state.callback) {
            // TODO: move to controller
            this._outputs = outputs.outputs;
        }
    }

    private processErrors(result, details) {
        this.errors = result.error.details.map((err) => {
            const name = err.path[err.path.length - 1];

            return {
                path: err.path.join("."),
                name: name,
                message: err.message,
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

    private summaryDetails(
        request,
        model: AdapterFormModel,
        state: FormSubmissionState,
        relevantPages
    ) {
        const details: object[] = [];

        [undefined, ...model.sections].forEach((section) => {
            const items: any[] = [];
            let sectionState = section ? state[section.name] || {} : state;

            sectionState.originalFilenames = state.originalFilenames ?? {};

            const sectionPages = relevantPages.filter(
                (page) => page.section === section
            );

            const repeatablePage = sectionPages.find((page) => !!page.repeatField);
            // Currently can't handle repeatable page outside a section.
            // In fact currently if any page in a section is repeatable it's expected that all pages in that section will be
            // repeatable
            if (section && repeatablePage) {
                if (!state[section.name]) {
                    state[section.name] = sectionState = [];
                }
                // Make sure the right number of items
                const requiredIterations = reach(state, repeatablePage.repeatField);
                if (requiredIterations < sectionState.length) {
                    state[section.name] = sectionState.slice(0, requiredIterations);
                } else {
                    for (let i = sectionState.length; i < requiredIterations; i++) {
                        sectionState.push({});
                    }
                }
            }

            sectionPages.forEach((page) => {
                for (const component of page.components.formItems) {
                    const item = Item(request, component, sectionState, page, model);
                    if (items.find((cbItem) => cbItem.name === item.name)) return;
                    items.push(item);
                    if (component.items) {
                        const selectedValue = sectionState[component.name];
                        const selectedItem = component.items.filter(
                            (i) => i.value === selectedValue
                        )[0];
                        if (selectedItem && selectedItem.childrenCollection) {
                            for (const cc of selectedItem.childrenCollection.formItems) {
                                const cItem = Item(request, cc, sectionState, page, model);
                                items.push(cItem);
                            }
                        }
                    }
                }
            });

            if (items.length > 0) {
                if (Array.isArray(sectionState)) {
                    details.push({
                        name: section?.name,
                        title: section?.title,
                        items: [...Array(reach(state, repeatablePage.repeatField))].map(
                            (_x, i) => {
                                return items.map((item) => item[i]);
                            }
                        ),
                    });
                } else {
                    details.push({
                        name: section?.name,
                        title: section?.title,
                        items,
                    });
                }
            } else {
                if ((section?.name && section?.title) && !config.ignoreSectionsFromSummary.includes(section?.name)) {
                    details.push({
                        name: section?.name,
                        title: section?.title,
                        message: "This section has not been answered",
                        items,
                    });
                }
            }
        });
        request.logger.info({
            ...LOGGER_DATA,
            message: `Viewable summary data set [${JSON.stringify(details)}]`,
            form_session_identifier: state.metadata?.form_session_identifier ?? ""
        });
        return details;
    }

    get validatedWebhookData() {
        const result = webhookSchema.validate(this._webhookData, {
            abortEarly: false,
            stripUnknown: true,
        });
        return result.value;
    }

    get webhookDataPaymentReference() {
        const fees = this._webhookData?.fees;

        if (fees && fees.paymentReference) {
            return fees.paymentReference;
        }

        return "";
    }

    set webhookDataPaymentReference(paymentReference: string) {
        const fees = this._webhookData?.fees;
        if (fees) {
            fees.paymentReference = paymentReference;
        }
    }

    get outputs() {
        return this._outputs;
    }

    set outputs(value) {
        this._outputs = value;
    }

    // @ts-ignore
    /**
     * If a declaration is defined, add this to {@link this._webhookData} as a question has answered `true` to
     */
    addDeclarationAsQuestion() {
        this._webhookData?.questions?.push({
            category: null,
            question: "Declaration",
            fields: [
                {
                    key: "declaration",
                    title: "Declaration",
                    type: "boolean",
                    answer: true,
                },
            ],
        });
    }

    private addFeedbackSourceDataToWebhook(
        webhookData,
        model: AdapterFormModel,
        request
    ) {
        if (model.def.feedback?.feedbackForm) {
            const feedbackContextInfo = decodeFeedbackContextInfo(
                request.url.searchParams.get(feedbackReturnInfoKey)
            );

            if (feedbackContextInfo) {
                webhookData.questions.push(
                    ...FEEDBACK_CONTEXT_ITEMS.map((item) => ({
                        category: null,
                        question: item.display,
                        fields: [
                            {
                                key: item.key,
                                title: item.display,
                                type: "string",
                                answer: item.get(feedbackContextInfo),
                            },
                        ],
                    }))
                );
            }
        }
        return webhookData;
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
                Object.values(pages).reduce((acc: {}, p: any) => ({...acc, ...p}), {})
            );
        }
    });
}

/**
 * Creates an Item object for Details
 */
function Item(
    request,
    component,
    sectionState,
    page,
    model: AdapterFormModel,
    params: {
        num?: number;
        returnUrl: string,
        form_session_identifier?: string
    } = {
        returnUrl: redirectUrl(request, `/${model.basePath}/summary`),
    }
) {
    if (component?.options?.noReturnUrlOnSummaryPage === true) {
        // @ts-ignore
        delete params.returnUrl;
    }

    if (request.query.form_session_identifier) {
        params.form_session_identifier = request.query.form_session_identifier;
    }

    const isRepeatable = !!page.repeatField;

    //TODO:- deprecate in favour of section based and/or repeatingFieldPageController
    if (isRepeatable && Array.isArray(sectionState)) {
        return sectionState.map((state, i) => {
            const collated = Object.values(state).reduce(
                (acc: {}, p: any) => ({...acc, ...p}),
                {}
            );
            return Item(request, component, collated, page, model, {
                ...params,
                num: i + 1,
            });
        });
    }

    const item = {
        name: component.name,
        path: page.path,
        label: component.localisedString(component.title),
        value: component.getDisplayStringFromState(sectionState),
        rawValue: sectionState[component.name],
        url: redirectUrl(request, `/${model.basePath}${page.path}`, params),
        pageId: `/${model.basePath}${page.path}`,
        type: component.type,
        title: component.title,
        dataType: component.dataType,
        immutable: component.options.disableChangingFromSummary,
    };

    if (
        component.type === "FileUploadField" &&
        model.showFilenamesOnSummaryPage
    ) {
        //@ts-ignore
        item.filename = sectionState.originalFilenames[component.name]?.originalFilename;
    }

    return item;
}
