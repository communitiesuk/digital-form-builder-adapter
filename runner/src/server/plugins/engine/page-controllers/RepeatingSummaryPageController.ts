import {RepeatingFieldPageController} from "./RepeatingFieldPageController";
import {HapiLifecycleMethod, HapiRequest, HapiResponseToolkit} from "../../../types";
import {PageController} from "./PageController";
import {format, parseISO} from "date-fns";
import {AdapterSummaryViewModel} from "../models";

export class RepeatingSummaryPageController extends PageController {
    private getRoute!: HapiLifecycleMethod;
    private postRoute!: HapiLifecycleMethod;
    nextIndex!: RepeatingFieldPageController["nextIndex"];
    getPartialState!: RepeatingFieldPageController["getPartialState"];
    options!: RepeatingFieldPageController["options"];
    removeAtIndex!: RepeatingFieldPageController["removeAtIndex"];
    hideRowTitles!: RepeatingFieldPageController["hideRowTitles"];

    inputComponent;
    returnUrl;

    constructor(model, pageDef, inputComponent) {
        super(model, pageDef);
        this.inputComponent = inputComponent;
    }

    get getRouteHandler() {
        this.getRoute ??= this.makeGetRouteHandler();
        return this.getRoute;
    }

    get postRouteHandler() {
        this.postRoute ??= this.makePostRouteHandler();
        return this.postRoute;
    }

    /**
     * The controller which is used when Page["controller"] is defined as "./pages/summary.js"
     */

    /**
     * Returns an async function. This is called in plugin.ts when there is a GET request at `/{id}/{path*}`,
     */
    makeGetRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            const {adapterCacheService} = request.services([]);

            const {removeAtIndex} = request.query;
            if (removeAtIndex ?? false) {
                return this.removeAtIndex(request, h);
            }
            //@ts-ignore
            const state = await adapterCacheService.getState(request);
            const {progress = []} = state;
            const {query} = request;
            const {returnUrl} = query;
            this.returnUrl = returnUrl;

            progress?.push(`/${this.model.basePath}${this.path}?view=summary`);
            //@ts-ignore
            await adapterCacheService.mergeState(request, {progress});

            const viewModel = this.getViewModel(state, request);
            //@ts-ignore
            viewModel.crumb = request.plugins.crumb;

            this.backLink = state.callback?.returnUrl ?? progress[progress.length - 2];
            this.backLinkText = this.model.def?.backLinkText ?? "Go back to application overview";

            return h.view("repeating-summary", viewModel);
        };
    }

    entryToViewModelRow = ([key, value], iteration) => {
        const componentDef = this.pageDef.components.filter(
            (component) => component.name === key
        );

        const {title} = componentDef;
        const titleWithIteration = `${title} ${iteration + 1}`;
        return {
            key: {
                text: titleWithIteration,
            },
            value: {
                text: value,
            },
            actions: {
                items: [
                    {
                        href: `?view=${iteration}`,
                        text: "change",
                        visuallyHiddenText: titleWithIteration,
                    },
                ],
            },
        };
    };

    getViewModel(formData, request) {
        const baseViewModel = super.getViewModel(formData);
        let rows;
        const answers = this.getPartialState(formData);
        if (this.inputComponent.type === "MultiInputField") {
            const orderedNames = this.inputComponent.children.items.map(
                (x) => x.name
            );
            rows = this.buildTextFieldRows(
                answers,
                formData.metadata.form_session_identifier,
                orderedNames,
                request
            );
            return {
                ...baseViewModel,
                customText: this.options.customText,
                details: {rows, headings: this.inputComponent.options.columnTitles},
            };
        }

        rows = this.getRowsFromAnswers(answers, "summary");
        return {
            ...baseViewModel,
            customText: this.options.customText,
            details: {rows},
        };
    }

    buildRows(state, response, request) {
        let form_session_identifier =
            response.request.query.form_session_identifier ?? "";

        if (this.inputComponent.type === "MultiInputField") {
            const orderedNames = this.inputComponent.children.items.map(
                (x) => x.name
            );
            return this.buildTextFieldRows(
                state,
                form_session_identifier,
                orderedNames,
                request
            );
        }
        return this.getRowsFromAnswers(state, form_session_identifier);
    }

    getRowsFromAnswers(answers, form_session_identifier, view = false) {
        const {title = ""} = this.inputComponent;
        const listValueToText = this.inputComponent.list?.items?.reduce(
            (prev, curr) => ({...prev, [curr.value]: curr.text}),
            {}
        );

        return answers?.map((value, i) => {
            const titleWithIteration = `${title} ${i + 1}`;
            return {
                key: {
                    text: titleWithIteration,
                    classes: `${
                        this.hideRowTitles ? "govuk-summary-list__row--hidden-titles" : ""
                    }`,
                },
                value: {
                    text: listValueToText?.[value] ?? value,
                    classes: `${
                        this.hideRowTitles ? "govuk-summary-list__key--hidden-titles" : ""
                    }`,
                },
                actions: {
                    items: [
                        {
                            href: `?removeAtIndex=${i}${
                                view ? `&view=${view}` : ``
                            }${form_session_identifier}`,
                            //@ts-ignore
                            text: this.options.customText?.removeText ?? "Remove",
                            visuallyHiddenText: titleWithIteration,
                        },
                    ],
                },
            };
        });
    }

    isValidDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }

    _renderComponentByType(key, value) {
        const componentType = this.inputComponent.getComponentType(key);

        if (componentType == "DatePartsField") {
            return format(parseISO(value), "d/MM/yyyy");
        } else if (componentType == "MonthYearField") {
            return value[`${key}__month`] + "/" + value[`${key}__year`];
        } else if (componentType == "YesNoField") {
            return value ? "Yes" : "No";
        } else if (componentType == "UkAddressField") {
            return value
                ? [
                    value.addressLine1,
                    value.addressLine2,
                    value.town,
                    value.county,
                    value.postcode,
                ]
                    .filter((p) => {
                        return !!p;
                    })
                    .join(", ")
                : "";
        }

        return `${this.inputComponent.getPrefix(key)}${value}`;
    }

    buildTextFieldRows(
        answers,
        form_session_identifier,
        orderedNames,
        request,
        view = false
    ) {
        const {title = ""} = this.inputComponent;

        if (form_session_identifier) {
            form_session_identifier = `&form_session_identifier=${form_session_identifier}`;
        }

        return answers?.map((answer, i) => {
            const keyToRenderedValue = {};
            for (const [key, value] of Object.entries(answer)) {
                const renderedValue = this._renderComponentByType(key, value);
                keyToRenderedValue[key] = renderedValue;
            }

            const row = {
                action: {
                    href: `?removeAtIndex=${i}${view ? `&view=${view}` : ``}${
                        form_session_identifier ? form_session_identifier : ``
                    }`,
                    //@ts-ignore
                    text: this.options.customText?.removeText ?? request.i18n.__('removeText'),
                    visuallyHiddenText: title,
                },
                values: [],
            };
            //@ts-ignore
            for (const [i, name] of orderedNames.entries()) {
                row.values.push({
                    text: keyToRenderedValue[name],
                    class: "govuk-table__cell",
                } as never);
            }

            return row;
        });
    }

    /**
     * Returns an async function. This is called in plugin.ts when there is a POST request at `/{id}/{path*}`.
     * If a form is incomplete, a user will be redirected to the start page.
     */
    makePostRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            const {adapterCacheService, adapterStatusService} = request.services([]);
            //@ts-ignore
            const state = await adapterCacheService.getState(request);
            const query = request.query;
            let form_session_identifier = "";

            if (query.form_session_identifier) {
                form_session_identifier = `form_session_identifier=${query.form_session_identifier}`;
            }
            //@ts-ignore
            if (request.payload?.next === "increment") {
                const nextIndex = this.nextIndex(state);
                let returnUrl =
                    this.returnUrl !== undefined ? `&returnUrl=${this.returnUrl}` : "";
                return h.redirect(
                    `/${this.model.basePath}${this.path}?view=${nextIndex}${returnUrl}&${form_session_identifier}`
                );
            }


            const model = this.model;
            //@ts-ignore
            let savedState = await adapterCacheService.getState(request);
            //@ts-ignore
            const summaryViewModel = new AdapterSummaryViewModel(this.title, model, savedState, request, this);
            //@ts-ignore
            await adapterCacheService.mergeState(request, {
                ...savedState,
                webhookData: summaryViewModel.validatedWebhookData,
            });
            //@ts-ignore
            savedState = await adapterCacheService.getState(request);

            const startPage = this.model.def.startPage;
            const isStartPage = this.path === startPage;

            if (!isStartPage && savedState.metadata && savedState.webhookData) {
                //@ts-ignore
                const {statusCode} = await adapterStatusService.outputRequests(request);
                if ((statusCode === 301 || statusCode === 302) && state.metadata && state.metadata.round_close_notification_url) {
                    return h.redirect(state.metadata.round_close_notification_url);
                }
            }


            if (typeof this.returnUrl !== "undefined") {
                return h.redirect(this.returnUrl + `?${form_session_identifier}`);
            }

            return h.redirect(this.getNext(state) + `?${form_session_identifier}`);
        };
    }
}
