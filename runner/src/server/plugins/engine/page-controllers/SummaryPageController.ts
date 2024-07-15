import {
    feedbackReturnInfoKey,
    redirectTo
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/helpers";
import {
    decodeFeedbackContextInfo,
    FeedbackContextInfo,
    RelativeUrl
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine";
import config from "../../../../../../digital-form-builder/runner/src/server/config";
import { SummaryViewModel } from "../models/SummaryViewModel";
import { HapiRequest, HapiResponseToolkit } from "../../../types";
import { PageController } from "./PageController";

export class SummaryPageController extends PageController {
    /**
     * The controller which is used when Page["controller"] is defined as "./pages/summary.js"
     */

    /**
     * Returns an async function. This is called in plugin.ts when there is a GET request at `/{id}/{path*}`,
     */
    makeGetRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            this.langFromRequest(request);

            const { cacheService } = request.services([]);
            const model = this.model;

            // @ts-ignore - ignoring so docs can be generated. Remove when properly typed
            if (this.model.def.skipSummary) {
                return this.makePostRouteHandler()(request, h);
            }
            const state = await cacheService.getState(request);
            const viewModel = new SummaryViewModel(this.title, model, state, request);
            viewModel.footer = this.def.footer;
            return h.view("summary", viewModel);
        };
    }

    /**
     * Returns an async function. This is called in plugin.ts when there is a POST request at `/{id}/{path*}`.
     * If a form is incomplete, a user will be redirected to the start page.
     */
    makePostRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            const { payService, cacheService, uploadService } = request.services([]);
            const model = this.model;
            const state = await cacheService.getState(request);
            state.metadata.isSummaryPageSubmit = true;
            await cacheService.mergeState(request, { ...state });

            const summaryViewModel = new SummaryViewModel(
                this.title,
                model,
                state,
                request
            );

            this.setFeedbackDetails(summaryViewModel, request);
            this.setContactUsDetails(summaryViewModel, request);
            this.setPrivacyDetails(summaryViewModel, request);

            /**
             * If a form is configured with a declaration, a checkbox will be rendered with the configured declaration text.
             * If the user does not agree to the declaration, the page will be rerendered with a warning.
             */
            if (summaryViewModel.declaration && !summaryViewModel.skipSummary) {
                const { declaration } = request.payload as { declaration?: any };

                if (!declaration) {
                    request.yar.flash(
                        "declarationError",
                        "You must declare to be able to submit this application"
                    );
                    return redirectTo(
                        request,
                        h,
                        `${request.headers.referer}#declaration`
                    );
                }
                summaryViewModel.addDeclarationAsQuestion();
            }

            if (summaryViewModel.markAsCompleteComponent) {
                const { markAsComplete } = request.payload as { markAsComplete?: any };

                if (!markAsComplete) {
                    request.yar.flash("markAsCompleteError", "You must select yes or no");
                    return redirectTo(
                        request,
                        h,
                        `${request.headers.referer}#markAsComplete`
                    );
                }
                summaryViewModel.addMarkAsCompleteAsQuestion(
                    markAsComplete.toLowerCase() === "true"
                );
            }

            await cacheService.mergeState(request, {
                outputs: summaryViewModel.outputs,
                userCompletedSummary: true
            });
            await cacheService.mergeState(request, {
                webhookData: summaryViewModel.validatedWebhookData
            });

            /**
             * If a user does not need to pay, redirect them to /status
             */
            if (
                !summaryViewModel.fees ||
                (summaryViewModel.fees.details ?? []).length === 0
            ) {
                return redirectTo(request, h, `/${request.params.id}/status`);
            }

            // user must pay for service
            const description = payService.descriptionFromFees(summaryViewModel.fees);
            const url = new URL(
                `${config.payReturnUrl}/${request.params.id}/status`
            ).toString();
            const res = await payService.payRequest(
                summaryViewModel.fees,
                summaryViewModel.payApiKey || "",
                url
            );

            request.yar.set("basePath", model.basePath);
            await cacheService.mergeState(request, {
                pay: {
                    payId: res.payment_id,
                    reference: res.reference,
                    self: res._links.self.href,
                    returnUrl: new URL(
                        `${config.payReturnUrl}/${request.params.id}/status`
                    ).toString(),
                    meta: {
                        amount: summaryViewModel.fees.total,
                        description,
                        attempts: 1,
                        payApiKey: summaryViewModel.payApiKey
                    }
                }
            });
            summaryViewModel.webhookDataPaymentReference = res.reference;
            await cacheService.mergeState(request, {
                webhookData: summaryViewModel.validatedWebhookData
            });

            return redirectTo(request, h, res._links.next_url.href);
        };
    }

    setPrivacyDetails(viewModel: SummaryViewModel, request: HapiRequest) {

        let privacyPolicyUrl: string;
        if (request.query.form_session_identifier) {
            privacyPolicyUrl =
                this.getConfiguredPrivacyLink() +
                "?application_id=" +
                request.query.form_session_identifier;
        } else {
            privacyPolicyUrl = this.getConfiguredPrivacyLink();
        }
        viewModel.privacyPolicyUrl = privacyPolicyUrl;
    }

    getConfiguredPrivacyLink() {
        return config.privacyPolicyUrl;
    }

    setContactUsDetails(viewModel: SummaryViewModel, request: HapiRequest) {
        let contactUsUrl: string;
        if (request.query.form_session_identifier) {
            contactUsUrl =
                this.getConfiguredContactUsLink() +
                "?application_id=" +
                request.query.form_session_identifier;
        } else {
            contactUsUrl = this.getConfiguredContactUsLink();
        }
        viewModel.contactUsUrl = contactUsUrl;
    }

    getConfiguredContactUsLink() {
        return config.contactUsUrl;
    }

    setFeedbackDetails(viewModel: SummaryViewModel, request: HapiRequest) {
        const feedbackContextInfo = this.getFeedbackContextInfo(request);

        if (feedbackContextInfo) {
            // set the form name to the source form name if this is a feedback form
            viewModel.name = feedbackContextInfo.formTitle;
        }

        // setting the feedbackLink to undefined here for feedback forms prevents the feedback link from being shown
        viewModel.feedbackLink = this.feedbackUrlFromRequest(request);
        if (!viewModel.feedbackLink) {
            let feedbackLink: string;
            if (request.query.form_session_identifier) {
                feedbackLink =
                    this.getConfiguredFeedbackLink() +
                    "?application_id=" +
                    request.query.form_session_identifier;
            } else {
                feedbackLink = this.getConfiguredFeedbackLink();
            }
            viewModel.feedbackLink = feedbackLink;
        }
    }

    getConfiguredFeedbackLink() {
        return config.feedbackLink;
    }

    getFeedbackContextInfo(request: HapiRequest) {
        if (this.model.def.feedback?.feedbackForm) {
            if (request.url.searchParams.get(feedbackReturnInfoKey)) {
                return decodeFeedbackContextInfo(
                    request.url.searchParams.get(feedbackReturnInfoKey)
                );
            }
        }
    }

    feedbackUrlFromRequest(request: HapiRequest) {
        if (this.model.def.feedback?.url) {
            let feedbackLink = new RelativeUrl(this.model.def.feedback.url);
            const returnInfo = new FeedbackContextInfo(
                this.model.name,
                "Summary",
                `${request.url.pathname}${request.url.search}`
            );
            feedbackLink.setParam(feedbackReturnInfoKey, returnInfo.toString());
            return feedbackLink.toString();
        }

        return undefined;
    }

    get postRouteOptions() {
        return {
            ext: {
                onPreHandler: {
                    method: async (_request: HapiRequest, h: HapiResponseToolkit) => {
                        return h.continue;
                    }
                }
            }
        };
    }
}
