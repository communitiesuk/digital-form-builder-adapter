import {PageController} from "./PageController";
import {RepeatingSummaryPageController} from "./RepeatingSummaryPageController";
import {ComponentDef, RepeatingFieldPage} from "@xgovformbuilder/model";
import {FormComponent} from "../components";

import joi from "joi";
import {reach} from "hoek";
import {AdapterFormModel} from "../models";
import {HapiRequest, HapiResponseToolkit} from "../../../types";

const contentTypes: Array<ComponentDef["type"]> = [
    "Para",
    "Details",
    "Html",
    "InsetText",
];

function isInputType(component) {
    return !contentTypes.includes(component.type);
}

const DEFAULT_OPTIONS = {
    summaryDisplayMode: {
        samePage: false,
        separatePage: true,
        hideRowTitles: false,
    },
    customText: {
        columnOneTitle: "Description",
        columnTwoTitle: "Amount",
        columnThreeTitle: "Action",
    },
};

/**
 * TODO:- this will be refactored as per https://github.com/XGovFormBuilder/digital-form-builder/discussions/855
 */
export class RepeatingFieldPageController extends PageController {
    summary: RepeatingSummaryPageController;
    inputComponent: FormComponent;
    isRepeatingFieldPageController = true;
    isSamePageDisplayMode: boolean;
    isSeparateDisplayMode: boolean;
    hideRowTitles: boolean;

    options: RepeatingFieldPage["options"];

    constructor(model: AdapterFormModel, pageDef: RepeatingFieldPage) {
        super(model, pageDef);
        const inputComponent = this.components?.items?.find(isInputType);
        if (!inputComponent) {
            throw Error(
                "RepeatingFieldPageController initialisation failed, no input component (non-content) was found"
            );
        }

        this.options = pageDef?.options ?? DEFAULT_OPTIONS;
        this.options.summaryDisplayMode ??= DEFAULT_OPTIONS.summaryDisplayMode;
        //@ts-ignore
        this.options.hideRowTitles ??= DEFAULT_OPTIONS.hideRowTitles;
        this.options.customText ??= DEFAULT_OPTIONS.customText;

        this.isSamePageDisplayMode = this.options.summaryDisplayMode.samePage!;
        this.isSeparateDisplayMode = this.options.summaryDisplayMode.separatePage!;
        this.hideRowTitles = this.options.summaryDisplayMode.hideRowTitles!;

        this.inputComponent = inputComponent as FormComponent;

        this.summary = new RepeatingSummaryPageController(
            model,
            pageDef,
            this.inputComponent
        );
        this.summary.getPartialState = this.getPartialState;
        this.summary.nextIndex = this.nextIndex;
        this.summary.removeAtIndex = this.removeAtIndex;
        this.summary.hideRowTitles = this.hideRowTitles;

        this.summary.options = this.options;
    }

    get stateSchema() {
        const name = this.inputComponent.name;
        const parentSchema = super.stateSchema.fork([name], (schema) => {
            if (schema.type !== "array") {
                return joi.array().items(schema).single().empty(null).default([]);
            }
            return schema;
        });
        super.stateSchema = parentSchema;
        return parentSchema;
    }

    makeGetRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            const {query} = request;
            const {removeAtIndex, view, returnUrl} = query;

            if (removeAtIndex ?? false) {
                return this.removeAtIndex(request, h);
            }

            if (view === "summary" || returnUrl) {
                return this.summary.getRouteHandler(request, h);
            }

            if ((view ?? false) || this.isSamePageDisplayMode) {
                const response = await super.makeGetRouteHandler()(request, h);
                const {adapterCacheService} = request.services([]);
                //@ts-ignore
                const state = await adapterCacheService.getState(request);
                const partialState = this.getPartialState(state, view);
                response.source.context.components &&= response.source.context.components.map(
                    (component) => {
                        const {model} = component;
                        model.value = partialState;
                        model.items &&= model.items.filter(
                            (item) => !state[model.name]?.includes(item.value)
                        );
                        return {
                            ...component,
                            model,
                        };
                    }
                );

                this.addRowsToViewContext(response, state);
                return response;
            }
            return super.makeGetRouteHandler()(request, h);
        };
    }

    addRowsToViewContext(response, state) {
        if (this.options!.summaryDisplayMode!.samePage) {
            const rows = this.summary.getRowsFromAnswers(this.getPartialState(state));
            response.source.context.details = {rows};
        }
    }

    async removeAtIndex(request, h) {
        const {query} = request;
        const {removeAtIndex, view} = query;
        const {cacheService} = request.services([]);
        let state = await cacheService.getState(request);
        const key = this.inputComponent.name;
        const answers = state[key];
        answers?.splice(removeAtIndex, 1);
        await cacheService.mergeState(request, {[key]: answers});
        if (state[key]?.length < 1) {
            return h.redirect("?view=0");
        }

        return h.redirect(`?view=${view ?? 0}`);
    }

    makePostRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            const {query} = request;

            if (query.view === "summary") {
                return this.summary.postRouteHandler(request, h);
            }
            //@ts-ignore
            if (request?.payload?.next === "continue") {
                // @ts-ignore
                const {next, ...rest} = request.payload;
                if (this.isSeparateDisplayMode) {
                    return h.redirect(`?view=summary`);
                }
                return h.redirect(this.getNext(rest));
            }

            const modifyUpdate = (update) => {
                const key = this.inputComponent.name;
                const value = update[key];
                const wrappedValue = !Array.isArray(value) ? [value] : value;
                return {
                    [key]: [...new Set(wrappedValue)],
                };
            };

            const response = await this.handlePostRequest(request, h, {
                arrayMerge: true,
                modifyUpdate,
            });

            if (response?.source?.context?.errors) {
                const {adapterCacheService} = request.services([]);
                //@ts-ignore
                const state = await adapterCacheService.getState(request);
                this.addRowsToViewContext(response, state);
                return response;
            }

            if (this.options!.summaryDisplayMode!.samePage) {
                return h.redirect(`/${this.model.basePath}${this.path}`);
            }
            return h.redirect(`/${this.model.basePath}${this.path}?view=summary`);
        };
    }

    getPartialState(state, atIndex?: number) {
        const keyName = this.inputComponent.name;
        const sectionName = this.pageDef.sectionName ?? "";
        const path = [sectionName, keyName].filter(Boolean).join(".");
        const partial = reach(state, path);
        if (atIndex ?? false) {
            return partial[atIndex!];
        }

        return partial;
    }

    nextIndex(state) {
        const partial = this.getPartialState(state) ?? [];
        return partial.length;
    }
}
