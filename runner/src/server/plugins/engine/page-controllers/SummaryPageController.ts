import {AdapterFormModel, AdapterSummaryViewModel} from "../models";
import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {redirectUrl} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine";
import {FormSubmissionState} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {FeesModel} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/models/submission";
import {PageController} from "./PageController";
import {isMultipleApiKey} from "@xgovformbuilder/model";
import {config} from "../../utils/AdapterConfigurationSchema";
import {redirectTo} from "../util/helper";
import {UtilHelper} from "../../utils/UtilHelper";
import {UkAddressField} from "../components";


export class SummaryPageController extends PageController {

    isEligibility: boolean = false;

    constructor(model: AdapterFormModel, pageDef: any) {
        // @ts-ignore
        super(model, pageDef);
        // @ts-ignore
        this.model = model;
    }

    makeGetRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            this.langFromRequest(request);

            const {adapterCacheService} = request.services([]);
            const model = this.model;

            // @ts-ignore - ignoring so docs can be generated. Remove when properly typed
            if (this.model.def.skipSummary) {
                return this.makePostRouteHandler()(request, h);
            }
            //@ts-ignore
            let state = await adapterCacheService.getState(request);
            if (!state.progress) {
                const currentPath = `/${this.model.basePath}${this.path}${request.url.search}`;
                const progress = state.progress || [];
                //@ts-ignore
                progress.push(currentPath);
                //@ts-ignore
                await adapterCacheService.mergeState(request, {progress});
                //@ts-ignore
                state = await adapterCacheService.getState(request);
            }
            if (state["metadata"] && state["metadata"]["has_eligibility"]) {
                this.isEligibility = state["metadata"]["has_eligibility"];
                this.backLinkText = UtilHelper.getBackLinkText(true, this.model.def?.metadata?.isWelsh);
                this.backLink = state.callback?.returnUrl;
            }

            if (state["metadata"] && state["metadata"]["is_read_only_summary"]) {
                this.formattingDataInTheStateToOriginal(state, model);
            }

            //@ts-ignore
            const viewModel = new AdapterSummaryViewModel(this.title, model, state, request, this);
            if (viewModel.endPage) {
                return redirectTo(request, h, `/${model.basePath}${viewModel.endPage.path}`);
            }

            if (state["metadata"] && state["metadata"]["is_read_only_summary"]) {
                //@ts-ignore
                viewModel.isReadOnlySummary = true;
                //@ts-ignore
                viewModel.backLinkText = UtilHelper.getBackLinkText(true, this.model.def?.metadata?.isWelsh);
                //@ts-ignore
                viewModel.backLink = state.callback?.returnUrl;
            }

            /**
             * iterates through the errors. If there are errors, a user will be redirected to the page
             * with the error with returnUrl=`/${model.basePath}/summary` in the URL query parameter.
             */
            if (viewModel.errors) {
                //@ts-ignore
                const {iteration, pageWithError} = this.extractErrors(viewModel, model, state);
                if (pageWithError) {
                    const params = {
                        returnUrl: redirectUrl(request, `/${model.basePath}/summary`),
                        num: iteration && pageWithError.repeatField ? iteration : null,
                    };
                    return redirectTo(request, h, `/${model.basePath}${pageWithError.path}`, params);
                }

            }
            this.loadRequestErrors(request, viewModel);
            await this.existingFilesToClientSideFileUpload(state, viewModel, request);

            return h.view("summary", viewModel);
        };
    }

    /** read all the formatted data & convert them back to original format
     // Ex.
     UkAddress field original format is
     {
         addressLine1: "",
         addressLine2: "",
         town: "",
         county: "",
         postcode: "",
     }
     but when we saving it converts back to comma seperated value.
     However, if we are going to show the data back in the summary,
     we have
     to convert the data back in to original format since in the view model
     we have a validation before going inside the summary page
     **/
    private formattingDataInTheStateToOriginal(state: FormSubmissionState, model: AdapterFormModel) {
        //@ts-ignore
        const ukAddressFields = this.findUkAddressFieldComponents(this.def.pages)
        //@ts-ignore
        for (let ukAddressField of ukAddressFields) {
            if (ukAddressField.section && state[ukAddressField.section]) {
                let field = new UkAddressField(ukAddressField.component, model);
                //@ts-ignore
                state[ukAddressField.section][ukAddressField.component.name] = field.convertStringAnswersIntoObject(state[ukAddressField.section][ukAddressField.component.name])
            } else {
                //@ts-ignore
                let field = new UkAddressField(ukAddressField.component, model);
                //@ts-ignore
                state[ukAddressField.component.name] = field.convertStringAnswersIntoObject(state[ukAddressField.component.name])
            }
        }
    }

    // Function to find all UkAddressField components
    private findUkAddressFieldComponents(pageDef) {
        let results: any = [];
        pageDef.forEach(page => {
            // Check if the page has components
            if (page.components) {
                for (let component of page.components) {
                    // If a component type is 'UkAddressField', add it to the results
                    //@ts-ignore
                    if (component.type === 'UkAddressField') {
                        if (page.section) {
                            results.push({"section": page.section, "component": component});
                        } else {
                            results.push({"section": undefined, "component": component});
                        }
                    }
                }
            }
        });
        return results;
    }

    makePostRouteHandler() {

        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            const {payService, adapterCacheService} = request.services([]);
            const model = this.model;
            //@ts-ignore
            const state = await adapterCacheService.getState(request);
            if (state.metadata) {
                state.metadata.isSummaryPageSubmit = true;
            }
            //@ts-ignore
            await adapterCacheService.mergeState(request, {...state});
            //@ts-ignore
            const summaryViewModel = new AdapterSummaryViewModel(this.title, model, state, request, this);
            this.setFeedbackDetails(summaryViewModel, request);

            // redirect user to start page if there are incomplete form errors
            if (summaryViewModel.result.error) {
                request.logger.error(`SummaryPage Error`, summaryViewModel.result.error);
                /** defaults to the first page */
                    // @ts-ignore - tsc reports an error here, ignoring so docs can be generated
                    // (does not cause eslint errors otherwise). Remove when properly typed
                let startPageRedirect = redirectTo(request, h, `/${model.basePath}${model.def.pages[0].path}`);
                const startPage = model.def.startPage;
                // @ts-ignore - tsc reports an error here, ignoring so docs can be generated (does not cause eslint errors otherwise). Remove when properly typed
                if (startPage.startsWith("http")) {
                    // @ts-ignore - tsc reports an error here, ignoring so docs can be generated (does not cause eslint errors otherwise). Remove when properly typed
                    startPageRedirect = redirectTo(request, h, startPage);
                } else if (model.def.pages.find((page) => page.path === startPage)) {
                    // @ts-ignore - tsc reports an error here, ignoring so docs can be generated (does not cause eslint errors otherwise). Remove when properly typed
                    startPageRedirect = redirectTo(request, h, `/${model.basePath}${startPage}`);
                }
                return startPageRedirect;
            }

            /**
             * If a form is configured with a declaration, a checkbox will be rendered with the configured declaration text.
             * If the user does not agree to the declaration, the page will be rerendered with a warning.
             */
            if (summaryViewModel.declaration && !summaryViewModel.skipSummary) {
                const {declaration} = request.payload as { declaration?: any; };

                if (!declaration) {
                    request.yar.flash("declarationError",
                        "You must declare to be able to submit this application");
                    const url = request.headers.referer ?? request.path;
                    return redirectTo(request, h, `${url}#declaration`);
                }
                summaryViewModel.addDeclarationAsQuestion();
            }


            if (summaryViewModel.markAsCompleteComponent) {
                const {markAsComplete} = request.payload as { markAsComplete?: any };
                if (!markAsComplete) {
                    request.yar.flash("markAsCompleteError", "You must select yes or no");
                    return redirectTo(request, h, `${request.headers.referer}#markAsComplete`);
                }
                summaryViewModel.addMarkAsCompleteAsQuestion(
                    markAsComplete.toLowerCase() === "true"
                );
            }


            // merge the changes into state and update status of the form section
            //@ts-ignore
            await adapterCacheService.mergeState(request,
                {outputs: summaryViewModel.outputs, userCompletedSummary: true,});

            request.logger.info(["Webhook data", "before send", request.yar.id],
                JSON.stringify(summaryViewModel.validatedWebhookData));

            //@ts-ignore
            await adapterCacheService.mergeState(request, {
                webhookData: summaryViewModel.validatedWebhookData,
            });

            const feesModel = FeesModel(model, state);

            /**
             * If a user does not need to pay, redirect them to /status
             */
            if ((feesModel?.details ?? [])?.length === 0) {
                return redirectTo(request, h, `/${request.params.id}/status`);
            }

            const payReturnUrl =
                this.model.feeOptions?.payReturnUrl ?? config.payReturnUrl;

            request.logger.info(`payReturnUrl has been configured to ${payReturnUrl}`);

            const url = new URL(`${payReturnUrl}/${request.params.id}/status`).toString();

            const payStateMeta = payService.createPayStateMeta({
                feesModel: feesModel!,
                payApiKey: this.payApiKey,
                url,
            });

            const res = await payService.payRequestFromMeta(payStateMeta);


            const payState = {
                pay: {
                    payId: res.payment_id,
                    reference: res.reference,
                    self: res._links.self.href,
                    next_url: res._links.next_url.href,
                    returnUrl: url,
                    meta: payStateMeta,
                },
            };

            request.yar.set("basePath", model.basePath);
            //@ts-ignore
            await adapterCacheService.mergeState(request, payState);
            summaryViewModel.webhookDataPaymentReference = res.reference;
            //@ts-ignore
            await adapterCacheService.mergeState(request, {webhookData: summaryViewModel.validatedWebhookData,});


            const payRedirectUrl = payState.pay.next_url;

            //@ts-ignore
            await adapterCacheService.mergeState(request, payState);
            return h.redirect(payRedirectUrl);
        };
    }


    private loadRequestErrors(request: HapiRequest, viewModel: AdapterSummaryViewModel) {
        const declarationError = request.yar.flash("declarationError");
        if (declarationError.length) {
            viewModel.declarationError = declarationError[0];
        }

        const markAsCompleteError = request.yar.flash("markAsCompleteError");
        if (markAsCompleteError.length) {
            viewModel.markAsCompleteError = markAsCompleteError[0];
        }
    }

    private extractErrors(viewModel: AdapterSummaryViewModel, model: AdapterFormModel, state: FormSubmissionState) {
        //@ts-ignore
        const errorToFix = viewModel.errors[0];
        const {path} = errorToFix;
        const parts = path.split(".");
        const section = parts[0];
        const property = parts.length > 1 ? parts[parts.length - 1] : null;
        const iteration = parts.length === 3 ? Number(parts[1]) + 1 : null;

        const pageWithError = model.pages.filter((page) => {
            if (page.section && page.section.name === section) {
                let propertyMatches = true;
                let conditionMatches = true;
                if (property) {
                    propertyMatches =
                        page.components.formItems.filter(
                            (item) => item.name === property
                        ).length > 0;
                }
                if (
                    propertyMatches &&
                    page.condition &&
                    model.conditions[page.condition]
                ) {
                    conditionMatches = model.conditions[page.condition].fn(state);
                }
                return propertyMatches && conditionMatches;
            }
            return false;
        })[0];
        return {iteration, pageWithError};
    }


    get payApiKey(): string {
        const modelDef = this.model.def;
        //@ts-ignore
        const payApiKey = modelDef.feeOptions?.payApiKey ?? def.payApiKey;

        if (isMultipleApiKey(payApiKey)) {
            return payApiKey[config.apiEnv] ?? payApiKey.test ?? payApiKey.production;
        }
        return payApiKey;
    }
}
