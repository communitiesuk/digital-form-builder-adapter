import {merge, reach} from "@hapi/hoek";
import * as querystring from "querystring";

import {
    feedbackReturnInfoKey
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/helpers";
import {
    decodeFeedbackContextInfo,
    FeedbackContextInfo,
    RelativeUrl,
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine";
import {
    ChangeRequest,
    HapiRequest,
    HapiResponseObject,
    HapiResponseToolkit,
} from "../../../types";
import {
    FormData,
    FormPayload,
    FormSubmissionErrors,
    FormSubmissionState,
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {
    ComponentCollectionViewModel
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components/types";
import {format, parseISO} from "date-fns";
import nunjucks from "nunjucks";
import {AdapterFormModel} from "../models";
import {ComponentCollection} from "../components";
import {config} from "../../utils/AdapterConfigurationSchema";
import {proceed, redirectTo} from "../util/helper";
import {UtilHelper} from "../../utils/UtilHelper";
import {validationOptions} from "./ValidationOptions";

const FORM_SCHEMA = Symbol("FORM_SCHEMA");
const STATE_SCHEMA = Symbol("STATE_SCHEMA");
const ADDITIONAL_VALIDATION_FUNCTIONS = Symbol(
    "ADDITIONAL_VALIDATION_FUNCTIONS"
);

export class PageControllerBase {
    /**
     * The base class for all page controllers. Page controllers are responsible for generating the get and post route handlers when a user navigates to `/{id}/{path*}`.
     */
    def: {
        name: string;
        feedback?: {
            url?: string;
            feedbackForm?: boolean;
            emailAddress?: string;
        };
        phaseBanner?: {
            phase?: string;
        };
    };
    name: string;
    model: AdapterFormModel;
    pageDef: any;
    path: string;
    title: string;
    condition: any;
    repeatField: any;
    section: any;
    components: ComponentCollection;
    hasFormComponents: boolean;
    hasConditionalFormComponents: boolean;
    backLinkFallback?: string;
    saveAndContinueText: string;
    confirmAndContinueText: string;
    continueText: string;
    backLink: string;
    backLinkText: string;

    // TODO: pageDef type
    constructor(model: AdapterFormModel, pageDef: { [prop: string]: any } = {}) {
        const {def} = model;
        // @ts-ignore
        this.def = def;
        // @ts-ignore
        this.name = def.name;
        this.model = model;
        this.pageDef = pageDef;
        this.path = pageDef.path;
        this.title = pageDef.title;
        this.condition = pageDef.condition;
        this.repeatField = pageDef.repeatField;
        this.backLinkFallback = pageDef.backLinkFallback;
        // Resolve section
        this.section = model.sections?.find(
            (section) => section.name === pageDef.section
        );

        // Components collection
        const components = this.getAdapterComponentCollection(pageDef, model);
        const conditionalFormComponents = components.formItems.filter(
            (c: any) => c.conditionalComponents
        );

        const fieldsForPrePopulation = components.prePopulatedItems;

        if (this.section) {
            this.model.fieldsForPrePopulation[this.section.name] = {
                ...(this.model.fieldsForPrePopulation[this.section.name] ?? {}),
                ...fieldsForPrePopulation,
            };
        } else {
            this.model.fieldsForPrePopulation = {
                ...this.model.fieldsForPrePopulation,
                ...fieldsForPrePopulation,
            };
        }
        this.components = components;
        this.hasFormComponents = !!components.formItems.length;
        this.hasConditionalFormComponents = !!conditionalFormComponents.length;

        this.saveAndContinueText = "Save and continue";
        this.confirmAndContinueText = "Confirm and continue";
        this.continueText = "Continue";

        if (this.model?.def?.metadata?.isWelsh) {
            this.saveAndContinueText = "Cadw a pharhau";
            this.confirmAndContinueText = "cadarnhau a pharhau";
            this.continueText = "Parhau";
        }

        this.backLink = "";
        this.backLinkText = this.model.def?.backLinkText ?? UtilHelper.getBackLinkText(false, this.model.def?.metadata?.isWelsh)

        this[FORM_SCHEMA] = this.components.formSchema;
        this[STATE_SCHEMA] = this.components.stateSchema;
        this[ADDITIONAL_VALIDATION_FUNCTIONS] = this.components.additionalValidationFunctions;

    }

    getAdapterComponentCollection(pageDef: { [p: string]: any }, model: AdapterFormModel) {
        return new ComponentCollection(pageDef.components, model);
    }

    /**
     * Used for mapping FormData and errors to govuk-frontend's template api, so a page can be rendered
     */
    getViewModel(formData: FormData, iteration?: any, errors?: any): {
        page: PageControllerBase;
        name: string;
        pageTitle: string;
        sectionTitle: string;
        showTitle: boolean;
        components: ComponentCollectionViewModel;
        errors: FormSubmissionErrors;
        isStartPage: boolean;
        startPage?: HapiResponseObject;
        backLink?: string;
        backLinkText?: string;
        continueButtonText?: string;
        phaseTag?: string | undefined;
        changeRequests?: ChangeRequest[] | undefined;
    } {
        let showTitle = true;
        let pageTitle = this.title;
        if (config.allowUserTemplates) {
            pageTitle = nunjucks.renderString(pageTitle, {
                ...formData,
            });
        }
        let sectionTitle = !this.section?.hideTitle && this.section?.title;
        if (sectionTitle && iteration !== undefined) {
            sectionTitle = `${sectionTitle} ${iteration}`;
        }
        const components = this.components.getViewModel(formData, errors);

        const formComponents = components.filter((c) => c.isFormComponent);
        const hasSingleFormComponent = formComponents.length === 1;
        const singleFormComponent = hasSingleFormComponent
            ? formComponents[0]
            : null;
        const singleFormComponentIsFirst =
            singleFormComponent && singleFormComponent === components[0];

        if (singleFormComponent && singleFormComponentIsFirst) {
            const label: any = singleFormComponent.model.label;

            if (pageTitle) {
                label.text = pageTitle;
            }

            label.isPageHeading = true;
            label.classes = "govuk-label--l";
            pageTitle = pageTitle || label.text;
            showTitle = false;
        }

        return {
            page: this,
            name: this.name,
            pageTitle,
            sectionTitle,
            showTitle,
            components,
            errors,
            isStartPage: false
        };
    }

    /**
     * utility function that checks if this page has any items object.
     */
    get hasNext() {
        return Array.isArray(this.pageDef.next) && this.pageDef.next.length > 0;
    }

    get next() {
        const pageDefNext = this.pageDef.next ?? [];

        return pageDefNext
            .map((next: { path: string; redirect?: string }) => {
                const {path} = next;

                if (next?.redirect) {
                    return next;
                }

                const page = this.model.pages.find((page: PageControllerBase) => {
                    return path === page.path;
                });

                if (!page) {
                    return null;
                }

                return {
                    ...next,
                    page,
                };
            })
            .filter((v: {} | null) => !!v);
    }

    /**
     * @param state - the values currently stored in a users session
     * @param suppressRepetition - cancels repetition logic
     */
    getNextPage(state: FormSubmissionState, suppressRepetition = false) {
        if (this.repeatField && !suppressRepetition) {
            const requiredCount = reach(state, this.repeatField);
            const otherRepeatPagesInSection = this.model.pages.filter(
                (page) => page.section === this.section && page.repeatField
            );
            const sectionState = state[this.section.name] || {};
            if (
                Object.keys(sectionState[sectionState.length - 1]).length ===
                otherRepeatPagesInSection.length
            ) {
                // iterated all pages at least once
                const lastIteration = sectionState[sectionState.length - 1];
                if (
                    otherRepeatPagesInSection.length === this.objLength(lastIteration)
                ) {
                    // this iteration is 'complete'
                    if (sectionState.length < requiredCount) {
                        return this.findPageByPath(Object.keys(lastIteration)[0]);
                    }
                }
            }
        }

        let defaultLink;
        const nextLink = this.next.find((link) => {
            const {condition} = link;
            if (!condition) {
                defaultLink = link;
            }
            const conditionPassed =
                (this.model.conditions[condition] && (this.model.conditions[condition].fn(state) || this.model.conditions[condition].fn(state[this.section?.name])));
            if (conditionPassed) {
                return link;
            }
            return false;
        });

        if (nextLink?.redirect) {
            return nextLink;
        }

        return nextLink?.page ?? defaultLink?.page;
    }

    /* 1. Check whether there are any conditions attached into form page
        2. Get Condition field details
        3. Get value difference based on the webhook and state then remove the returnUrl
        so this will allow the application to decide the next page other than allowing SummaryPageController
        To Decide the next page
        */
    removeReturnUrlIfConditionalFieldValueIsChanged(
        returnUrl: string | undefined,
        state: any,
        request: HapiRequest
    ): string | undefined {
        if (!returnUrl) return undefined;
        // Get links with conditions
        const conditionAvailableLinks = this.pageDef.next.filter(link => link.condition);
        if (!conditionAvailableLinks.length) return returnUrl;
        // Extract reusable references
        const {questions} = state.webhookData;
        if (!questions) return returnUrl;
        const sectionName = this.section.name;
        for (const link of conditionAvailableLinks) {
            //@ts-ignore
            const condition = this.def.conditions.find(cond => cond.name === link.condition);
            if (!condition) continue;
            for (const attachedCondition of condition.value.conditions) {
                const fieldName = attachedCondition.field?.name;
                if (!fieldName) continue;
                for (const question of questions) {
                    const matchedField = question.fields.find(field => `${sectionName}.${field.key}` === fieldName);
                    if (matchedField) {
                        const fieldValue = state[sectionName]?.[matchedField.key];
                        if (fieldValue !== matchedField.answer) {
                            delete request.query.returnUrl;
                            return undefined;
                        }
                    }
                }
            }
        }
        return returnUrl;
    }

    async validateComponentFunctions(request, viewModel) {
        let errors = [];
        for (let func of this.additionalValidationFunctions) {
            const errorList = await func(request, viewModel);
            // @ts-ignore
            errors.push(...errorList);
        }
        return errors;
    }

    get additionalValidationFunctions() {
        return this[ADDITIONAL_VALIDATION_FUNCTIONS];
    }

    hasDataInThePage(state: FormSubmissionState): boolean {
        if (this.pageDef.section && state[this.pageDef.section]) {
            for (let component of this.pageDef.components) {
                if (state[this.pageDef.section][component.name] !== undefined) {
                    return true;
                }
            }
            return false;
        } else {
            for (let component of this.pageDef.components) {
                if (state[component.name] !== undefined) {
                    return true;
                }
            }
            return false;
        }
    }

    /**
     * returns the path to the next page
     */
    getNext(state: any) {
        const nextPage = this.getNextPage(state);
        if (nextPage?.redirect) {
            return nextPage.redirect;
        }
        const query = {num: 0};
        let queryString = "";
        if (nextPage?.repeatField) {
            const requiredCount = reach(state, nextPage.repeatField);
            const otherRepeatPagesInSection = this.model.pages.filter(
                (page) => page.section === this.section && page.repeatField
            );
            const sectionState = state[nextPage.section.name];
            const lastInSection = sectionState?.[sectionState.length - 1] ?? {};
            const isLastComplete =
                Object.keys(lastInSection).length === otherRepeatPagesInSection.length;
            query.num = sectionState
                ? isLastComplete
                    ? this.objLength(sectionState) + 1
                    : this.objLength(sectionState)
                : 1;

            if (query.num <= requiredCount) {
                queryString = `?${querystring.encode(query)}`;
            }
        }

        if (nextPage) {
            return `/${this.model.basePath || ""}${nextPage.path}${queryString}`;
        }
        return this.defaultNextPath;
    }

    /**
     * gets the state for the values that can be entered on just this page
     */
    getFormDataFromState(state: any, atIndex: number): FormData {
        const pageState = this.section ? state[this.section.name] : state;

        if (this.repeatField) {
            const repeatedPageState =
                pageState?.[atIndex ?? (pageState.length - 1 || 0)] ?? {};
            const values = Object.values(repeatedPageState);

            const newState = values.length
                ? values.reduce((acc: any, page: any) => ({...acc, ...page}), {})
                : {};

            return {
                ...this.components.getFormDataFromState(
                    newState as FormSubmissionState
                ),
                ...this.model.fieldsForContext?.getFormDataFromState(
                    newState as FormSubmissionState
                ),
            };
        }
        return {
            ...this.components.getFormDataFromState(pageState || {}),
            ...this.model.getContextState(state),
        };
    }

    getStateFromValidForm(formData: FormPayload) {
        return this.components.getStateFromValidForm(formData);
    }

    /**
     * Parses the errors from joi.validate so they can be rendered by govuk-frontend templates
     * @param validationResult - provided by joi.validate
     */
    getErrors(validationResult, request: HapiRequest): FormSubmissionErrors | undefined {
        if (validationResult && validationResult.error) {
            const isoRegex = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

            const errorList = validationResult.error.details.map((err) => {
                const name = err.path
                    .map((name: string, index: number) => index > 0 ? `__${name}` : name)
                    .join("");


                let errorMessage = err.message
                    .replace(isoRegex, (text) => {
                        return format(parseISO(text), "d MMMM yyyy");
                    })
                errorMessage = errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);

                return {
                    path: err.path.join("."),
                    href: `#${name}`,
                    name: name,
                    text: errorMessage,
                };
            });

            return {
                titleText: request.i18n.__('validation.title2'),
                errorList: errorList.filter(
                    ({text}, index) =>
                        index === errorList.findIndex((err) => err.text === text)
                ),
            };
        }

        return undefined;
    }

    /**
     * Runs joi validate
     * @param value - user's answers
     * @param schema - which schema to validate against
     * @param request
     */
    validate(value, schema, request: HapiRequest) {
        const result = schema.validate(value, validationOptions(request));
        const errors = result.error ? this.getErrors(result, request) : null;

        return {value: result.value, errors};
    }

    validateForm(payload, request: HapiRequest) {
        return this.validate(payload, this.formSchema, request);
    }

    validateState(newState, request: HapiRequest) {
        return this.validate(newState, this.stateSchema, request);
    }

    /**
     * returns the language set in a user's browser. Can be used for localisable strings
     */
    langFromRequest(request: HapiRequest) {
        const lang = request.query.lang || request.yar.get("lang") || "en";
        if (lang !== request.yar.get("lang")) {
            request.i18n.setLocale(lang);
            request.yar.set("lang", lang);
        }
        return request.yar.get("lang");
    }

    /**
     * Returns an async function. This is called in plugin.ts when there is a GET request at `/{id}/{path*}`
     */
    getConditionEvaluationContext(model: AdapterFormModel, state: FormSubmissionState) {
        //Note: This function does not support repeatFields right now

        let relevantState: FormSubmissionState = {};
        //Start at our startPage
        let nextPage = model.startPage;

        //While the current page isn't null
        while (nextPage != null) {
            //Either get the current state or the current state of the section if this page belongs to a section
            const currentState =
                (nextPage.section ? state[nextPage.section.name] : state) ?? {};
            let newValue = {};

            //Iterate all components on this page and pull out the saved values from the state
            for (const component of nextPage.components.items) {
                newValue[component.name] = currentState[component.name];
            }

            if (nextPage.section) {
                newValue = {[nextPage.section.name]: newValue};
            }

            //Combine our stored values with the existing relevantState that we've been building up
            relevantState = merge(relevantState, newValue);

            //By passing our current relevantState to getNextPage, we will check if we can navigate to this next page (including doing any condition checks if applicable)
            const possibleNextPage = nextPage.getNextPage(relevantState);
            if (possibleNextPage?.redirect) {
                nextPage = null;
            } else {
                nextPage = possibleNextPage;
            }

            //If a nextPage is returned, we must have taken that route through the form so continue our iteration with the new page
        }

        return relevantState;
    }

    makeGetRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            const {adapterCacheService} = request.services([]);
            const lang = this.langFromRequest(request);
            console.log(`${request.yar.set("lang", lang)} Language set `)
            //@ts-ignore
            let state = await adapterCacheService.getState(request);
            if (state["metadata"] && state["metadata"]["is_read_only_summary"]) {
                let form_session_identifier = state.metadata?.form_session_identifier ?? "";
                if (form_session_identifier) {
                    return redirectTo(request, h, `/${this.model.basePath}/summary?form_session_identifier=${form_session_identifier}`)
                }
                return redirectTo(request, h, `/${this.model.basePath}/summary`);
            }
            const progress = state.progress || [];
            const {num} = request.query;
            const currentPath = `/${this.model.basePath}${this.path}${request.url.search}`;
            const startPage = this.model.def.startPage;
            const formData = this.getFormDataFromState(state, num - 1);

            const isStartPage = this.path === `${startPage}`;
            const isInitialisedSession = !!state.callback;
            const shouldRedirectToStartPage =
                !this.model.options.previewMode &&
                progress.length === 0 &&
                !request.pre.hasPrepopulatedSessionFromQueryParameter &&
                !isStartPage &&
                !isInitialisedSession;

            this.backLink = state.callback?.returnUrl ?? progress[progress.length - 2];
            if (state["metadata"] && state["metadata"]["has_eligibility"]) {
                this.backLinkText = UtilHelper.getBackLinkText(true, this.model.def?.metadata?.isWelsh);
            }

            if (shouldRedirectToStartPage) {
                // @ts-ignore
                return startPage!.startsWith("http")
                    ? redirectTo(request, h, startPage!)
                    : redirectTo(request, h, `/${this.model.basePath}${startPage!}`);
            }

            formData.lang = lang;
            /**
             * We store the original filename for the user in a separate object (`originalFileNames`), however they are not used for any of the outputs. The S3 url is stored in the state.
             */
            const {originalFilenames} = state;
            if (originalFilenames) {
                Object.entries(originalFilenames).forEach(([key, fileDetail]) => {
                    if (fileDetail) {
                        //@ts-ignore
                        formData[key] = fileDetail.originalFilename;
                    }
                });
            }
            request.logger.info(`[PageControllerBase][${state.metadata?.form_session_identifier}] summary details ${JSON.stringify(formData)}`);
            const viewModel = this.getViewModel(formData, num);
            viewModel.startPage = startPage!.startsWith("http")
                ? redirectTo(request, h, startPage!)
                : redirectTo(request, h, `/${this.model.basePath}${startPage!}`);

            this.setPhaseTag(viewModel);
            this.setFeedbackDetails(viewModel, request);
            await this.setExistingFilesToClientSideFileUpload(state, viewModel, currentPath, request);

            /**
             * Content components can be hidden based on a condition. If the condition evaluates to true, it is safe to be kept, otherwise discard it
             */
                //Calculate our relevantState, which will filter out previously input answers that are no longer relevant to this user journey
            let relevantState = this.getConditionEvaluationContext(this.model, state);

            //Filter our components based on their conditions using our calculated state
            viewModel.components = viewModel.components.filter((component) => {
                if (
                    (component.model.content || component.type === "Details") &&
                    component.model.condition
                ) {
                    const condition = this.model.conditions[component.model.condition];
                    return condition.fn(relevantState);
                }
                return true;
            });
            /**
             * For conditional reveal components (which we no longer support until GDS resolves the related accessibility issues {@link https://github.com/alphagov/govuk-frontend/issues/1991}
             */
            viewModel.components = viewModel.components.map((component) => {
                const evaluatedComponent = component;
                const content = evaluatedComponent.model.content;
                if (content instanceof Array) {
                    evaluatedComponent.model.content = content.filter((item) =>
                        item.condition
                            ? this.model.conditions[item.condition].fn(relevantState)
                            : true
                    );
                }
                // apply condition to items for radios, checkboxes etc
                const items = evaluatedComponent.model.items;

                if (items instanceof Array) {
                    evaluatedComponent.model.items = items.filter((item) =>
                        item.condition
                            ? this.model.conditions[item.condition].fn(relevantState)
                            : true
                    );
                }

                return evaluatedComponent;
            });

            /**
             * used for when a user clicks the "back" link. Progress is stored in the state. This is a safer alternative to running javascript that pops the history `onclick`.
             */
            const lastVisited = progress[progress.length - 1];
            if (!lastVisited || !lastVisited.startsWith(currentPath)) {
                if (progress[progress.length - 2] === currentPath) {
                    progress.pop();
                } else {
                    progress.push(currentPath);
                }
            }
            //@ts-ignore
            await adapterCacheService.mergeState(request, {progress});
            //@ts-ignore
            state = await adapterCacheService.getState(request);

            viewModel.backLinkText = this.backLinkText;
            if (state.callback?.returnUrl) {
                viewModel.backLink = state.callback?.returnUrl;
            } else {
                this.backLink = viewModel.backLink = progress[progress.length - 2] ?? this.backLinkFallback;
            }
            viewModel.continueButtonText = "Save and continue"
            request.logger.info(`[PageControllerBase][${state.metadata?.form_session_identifier}] summary value ${JSON.stringify(viewModel.components)}`);
            this.updatePrivacyPolicyUrlAndContactUsUrl(state, viewModel)
            if (viewModel.page && viewModel.page.pageDef.controller && viewModel.page.pageDef.controller === "RepeatingFieldPageController") {
                if (viewModel.page.components && viewModel.page.components.items) {
                    //@ts-ignore
                    const multiInputField = viewModel.page.components.items.find(component => component.type === "MultiInputField");
                    if (multiInputField) {
                        //@ts-ignore
                        if (viewModel.page.components.items.length > 1 || (multiInputField.children && multiInputField.children.items && multiInputField.children.items.length > 1)) {
                            viewModel.showTitle = true;
                        }
                    }
                }
            }

            return h.view(this.viewName, viewModel);
        };
    }

    updatePrivacyPolicyUrlAndContactUsUrl(state: any, viewModel: any) {
        if (state && state["metadata"] && viewModel) {
            const fund_name = state["metadata"]["fund_name"];
            const round_name = state["metadata"]["round_name"];
            if (fund_name && round_name) {
                //@ts-ignore
                viewModel.privacyPolicyUrl = `${config.privacyPolicyUrl}?fund=${fund_name}&round=${round_name}`;
                //@ts-ignore
                viewModel.contactUsUrl = `${config.contactUsUrl}?fund=${fund_name}&round=${round_name}`;
            }
        }
    }

    private async setExistingFilesToClientSideFileUpload(state: FormSubmissionState, viewModel: any, currentPath: string, request: HapiRequest) {
        const {s3UploadService} = request.services([]);
        const form_session_identifier = state.metadata?.form_session_identifier ?? "";
        if (form_session_identifier) {
            const comp = viewModel.components.find((c) => c.type === "ClientSideFileUploadField");
            if (comp) {
                const pageAndForm = currentPath.includes("?") ? currentPath.split("?")[0] : currentPath;
                comp.model.pageAndForm = pageAndForm;
                const folderPath = `${form_session_identifier}${pageAndForm}/${comp.model.id}`;
                const files = await s3UploadService.listFilesInBucketFolder(folderPath, form_session_identifier);
                comp.model.existingFiles.push(...files);
            }
        }
    }

    async existingFilesToClientSideFileUpload(state: FormSubmissionState, viewModel: any, request: HapiRequest) {
        const {s3UploadService} = request.services([]);
        const form_session_identifier = state.metadata?.form_session_identifier ?? "";
        if (form_session_identifier) {
            for (const detail of viewModel.details) {
                const comps = detail.items.filter((c) => c.type === "ClientSideFileUploadField");
                for (const comp of comps) {
                    const folderPath = `${comp.pageId}/${comp.name}`;
                    const files = await s3UploadService.listFilesInBucketFolder(`${form_session_identifier}${folderPath}`, form_session_identifier);
                    comp.value = {folderPath, files,};
                }
            }
        }
    }

    /**
     * deals with parsing errors and saving answers to state
     */
    async handlePostRequest(
        request: HapiRequest,
        h: HapiResponseToolkit,
        mergeOptions: {
            nullOverride?: boolean;
            arrayMerge?: boolean;
            /**
             * if you wish to modify the value just before it is added to the user's session (i.e. after validation and error parsing), use the modifyUpdate method.
             * pass in a function, that takes in the update value. Make sure that this returns the modified value.
             */
            modifyUpdate?: <T>(value: T) => any;
        } = {}
    ) {
        const {adapterCacheService} = request.services([]);
        const hasFilesizeError = request.payload === null;
        const preHandlerErrors = request.pre.errors;
        const payload = (request.payload || {}) as FormData;
        const formResult: any = this.validateForm(payload, request);
        //@ts-ignore
        const state = await adapterCacheService.getState(request);
        const originalFilenames = (state || {}).originalFilenames || {};
        const viewModel = this.getViewModel(formResult)
        const fileFields = viewModel
            .components.filter((component) => component.type === "FileUploadField")
            .map((component) => component.model);
        const progress = state.progress || [];
        const {num} = request.query;

        this.validatingForErrors(hasFilesizeError, fileFields, formResult, preHandlerErrors, request);

        const additionalValidationErrors = await this.validateComponentFunctions(request, viewModel);
        if (additionalValidationErrors.length > 0) {
            if (
                formResult.errors &&
                "titleText" in formResult.errors &&
                "errorList" in formResult.errors
            ) {
                formResult.errors.errorList = formResult.errors.errorList.concat(
                    additionalValidationErrors
                );
            } else {
                formResult.errors = {
                    titleText: request.i18n.__('validation.title1'),
                    errorList: additionalValidationErrors,
                };
            }
        }

        Object.entries(payload).forEach(([key, value]) => {
            if (value && value === (originalFilenames[key] || {}).location) {
                payload[key] = originalFilenames[key].originalFilename;
            }
        });

        /**
         * If there are any errors, render the page with the parsed errors
         */
        if (formResult.errors) {
            return this.renderWithErrors(request, h, payload, num, progress, formResult.errors);
        }

        const newState = this.getStateFromValidForm(formResult.value);
        const stateResult = this.validateState(newState, request);
        if (stateResult.errors) {
            return this.renderWithErrors(request, h, payload, num, progress, stateResult.errors);
        }

        let update = this.getPartialMergeState(stateResult.value);
        if (this.repeatField) {
            const updateValue = {[this.path]: update[this.section.name]};
            const sectionState = state[this.section.name];
            if (!sectionState) {
                update = {[this.section.name]: [updateValue]};
            } else if (!sectionState[num - 1]) {
                sectionState.push(updateValue);
                update = {[this.section.name]: sectionState};
            } else {
                sectionState[num - 1] = merge(sectionState[num - 1] ?? {}, updateValue);
                update = {[this.section.name]: sectionState};
            }
        }

        const {nullOverride, arrayMerge, modifyUpdate} = mergeOptions;
        if (modifyUpdate) {
            update = modifyUpdate(update);
        }
        //@ts-ignore
        await adapterCacheService.mergeState(request, update, nullOverride, arrayMerge);
    }

    private validatingForErrors(hasFilesizeError: boolean, fileFields, formResult: any, preHandlerErrors, request: HapiRequest) {
        if (hasFilesizeError) {
            const reformattedErrors = fileFields.map((field) => {
                return {
                    path: field.name,
                    href: `#${field.name}`,
                    name: field.name,
                    text: request.i18n.__('validation.fileUpload.fileUploadSelectedFileMaxError').replace("{size}", config.maxFileSizeStringInMb),
                };
            });

            formResult.errors = Object.is(formResult.errors, null)
                ? {titleText: request.i18n.__('validation.title2'),}
                : formResult.errors;
            formResult.errors.errorList = reformattedErrors;
        }

        /**
         * other file related errors.. assuming file fields will be on their own page. This will replace all other errors from the page if not..
         */
        if (preHandlerErrors) {
            const reformattedErrors: any[] = [];
            preHandlerErrors.forEach((error) => {
                const reformatted = error;
                const fieldMeta = fileFields.find((field) => field.id === error.name);

                if (typeof reformatted.text === "string") {
                    /**
                     * if it's not a string it's probably going to be a stack trace.. don't want to show that to the user. A problem for another day.
                     */
                    reformatted.text = reformatted.text.replace(
                        /%s/,
                        fieldMeta?.label?.text.trim() ?? "the file"
                    );
                    reformattedErrors.push(reformatted);
                }
            });

            formResult.errors = Object.is(formResult.errors, null)
                ? {titleText: request.i18n.__('validation.title2'),}
                : formResult.errors;
            formResult.errors.errorList = reformattedErrors;
        }
    }

    /**
     * Returns an async function. This is called in plugin.ts when there is a POST request at `/{id}/{path*}`
     */
    makePostRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            const response = await this.handlePostRequest(request, h);
            if (response?.source?.context?.errors) {
                return response;
            }
            const {adapterCacheService} = request.services([]);
            //@ts-ignore
            const savedState = await adapterCacheService.getState(request);
            //This is required to ensure we don't navigate to an incorrect page based on stale state values
            let relevantState = this.getConditionEvaluationContext(
                this.model,
                savedState
            );

            return this.proceed(request, h, relevantState);
        };
    }

    setFeedbackDetails(viewModel, request) {
        const feedbackContextInfo = this.getFeedbackContextInfo(request);
        if (feedbackContextInfo) {
            viewModel.name = feedbackContextInfo.formTitle;
        }
        // setting the feedbackLink to undefined here for feedback forms prevents the feedback link from being shown
        if (this.def.feedback?.url) {
            viewModel.feedbackLink = this.feedbackUrlFromRequest(request);
        }
        if (this.def.feedback?.emailAddress) {
            viewModel.feedbackLink = `mailto:${this.def.feedback.emailAddress}`;
        }
    }

    getFeedbackContextInfo(request: HapiRequest) {
        if (this.def.feedback?.feedbackForm) {
            return decodeFeedbackContextInfo(
                request.url.searchParams.get(feedbackReturnInfoKey)
            );
        }
    }

    feedbackUrlFromRequest(request: HapiRequest): string | void {
        if (this.def.feedback?.url) {
            let feedbackLink = new RelativeUrl(this.def.feedback.url);
            const returnInfo = new FeedbackContextInfo(
                this.model.name,
                this.pageDef.title,
                `${request.url.pathname}${request.url.search}`
            );
            feedbackLink.setParam(feedbackReturnInfoKey, returnInfo.toString());
            return feedbackLink.toString();
        }
    }

    makeGetRoute() {
        return {method: "get", path: this.path, options: this.getRouteOptions, handler: this.makeGetRouteHandler(),};
    }

    makePostRoute() {
        return {method: "post", path: this.path, options: this.postRouteOptions, handler: this.makePostRouteHandler(),};
    }

    findPageByPath(path: string) {
        return this.model.pages.find((page) => page.path === path);
    }

    /**
     * TODO:- proceed is interfering with subclasses
     */
    proceed(request: HapiRequest, h: HapiResponseToolkit, state) {
        const nextPage = this.getNext(state);
        if (nextPage?.redirect) {
            return proceed(request, h, nextPage?.redirect);
        }
        return proceed(request, h, nextPage);
    }

    getPartialMergeState(value) {
        return this.section ? {[this.section.name]: value} : value;
    }

    localisedString(description, lang: string) {
        let string;
        if (typeof description === "string") {
            string = description;
        } else {
            string = description[lang] ? description[lang] : description.en;
        }
        return string;
    }

    get viewName() {
        return "index";
    }

    get defaultNextPath() {
        return `${this.model.basePath || ""}/summary`;
    }

    get conditionOptions() {
        return this.model.conditionOptions;
    }

    /**
     * {@link https://hapi.dev/api/?v=20.1.2#route-options}
     */
    get getRouteOptions() {
        return {};
    }

    /**
     * {@link https://hapi.dev/api/?v=20.1.2#route-options}
     */
    get postRouteOptions() {
        return {};
    }

    get formSchema() {
        return this[FORM_SCHEMA];
    }

    set formSchema(value) {
        this[FORM_SCHEMA] = value;
    }

    get stateSchema() {
        return this[STATE_SCHEMA];
    }

    set stateSchema(value) {
        this[STATE_SCHEMA] = value;
    }

    private objLength(object: {}) {
        return Object.keys(object).length;
    }

    private setPhaseTag(viewModel) {
        // Set phase tag if it exists in form definition (even if empty for 'None'),
        // otherwise the template context will simply return server config
        if (this.def.phaseBanner) {
            viewModel.phaseTag = this.def.phaseBanner.phase;
        }
    }

    private renderWithErrors(request, h, payload, num, progress, errors) {
        const viewModel = this.getViewModel(payload, num, errors);
        viewModel.backLink = progress[progress.length - 2] ?? this.backLinkFallback;
        viewModel.backLinkText = this.model.def?.backLinkText ?? UtilHelper.getBackLinkText(false, this.model.def?.metadata?.isWelsh);
        this.setPhaseTag(viewModel);
        this.setFeedbackDetails(viewModel, request);

        return h.view(this.viewName, viewModel);
    }
}
