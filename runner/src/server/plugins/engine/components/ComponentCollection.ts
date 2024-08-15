import joi, {Schema as JoiSchema} from "joi";

import * as Components from "./index";


import {merge} from "@hapi/hoek";
import {AdapterFormModel} from "../models";
import {AdapterComponentDef} from "@communitiesuk/model";
import {
    ComponentCollectionViewModel
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components/types";
import {
    FormData,
    FormPayload,
    FormSubmissionErrors,
    FormSubmissionState
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {ComponentBase} from "./ComponentBase";
import {AdapterFormComponent} from "./AdapterFormComponent";

export class ComponentCollection {
    items: (ComponentBase | ComponentCollection | AdapterFormComponent)[];
    formItems: AdapterFormComponent /* | ConditionalFormComponent*/[];
    prePopulatedItems: Record<string, JoiSchema>;
    formSchema: JoiSchema;
    stateSchema: JoiSchema;
    additionalValidationFunctions: Function[];

    constructor(adapterComponentDef: AdapterComponentDef[] = [], model: AdapterFormModel) {
        const components = this.mappingComponents(adapterComponentDef, model);
        const formComponents = components.filter((component) => component.isFormComponent);
        this.items = components;
        this.formItems = formComponents;
        this.formSchema = joi.object().keys(this.getFormSchemaKeys()).required().keys(
            {
                crumb: joi.string().optional().allow("")
            });
        this.stateSchema = joi.object().keys(this.getStateSchemaKeys()).required();
        //@ts-ignore
        this.prePopulatedItems = this.getPrePopulatedItems();
        this.additionalValidationFunctions = this.getAllAdditionalValidationFunctions();
    }

    mappingComponents(adapterComponentDef: AdapterComponentDef[], model: AdapterFormModel) {
        return adapterComponentDef.map((def) => {
            const Comp: any = Components[def.type];

            if (typeof Comp !== "function") {
                throw new Error(`Component type ${def.type} doesn't exist`);
            }

            return new Comp(def, model);
        });
    }

    getFormSchemaKeys() {
        const keys = {};
        this.formItems.forEach((item) => {
            Object.assign(keys, item.getFormSchemaKeys());
        });
        return keys;
    }

    getStateSchemaKeys() {
        const keys = {};
        this.formItems.forEach((item) => {
            Object.assign(keys, item.getStateSchemaKeys());
        });
        return keys;
    }

    getAllAdditionalValidationFunctions() {
        const funcs = [];
        this.formItems.forEach((item) => {
            if (item.getAdditionalValidationFunctions) {
                // @ts-ignore
                const itemFuncs = item.getAdditionalValidationFunctions();
                // @ts-ignore
                funcs.push(...itemFuncs);
            }
        });
        return funcs;
    }

    // @ts-ignore
    getPrePopulatedItems() {
        return this.formItems
            //@ts-ignore
            .filter((item) => item.options?.allowPrePopulation)
            .map((item) => {
                // to access the schema we need to use the component name to retrieve the value from getStateSchemaKeys
                const schema = item.getStateSchemaKeys()[item.name];
                return {
                    //@ts-ignore
                    [item.name]: {schema, allowPrePopulationOverwrite: item.options.allowPrePopulationOverwrite,},
                };
            })
            .reduce((acc, curr) => merge(acc, curr), {});
    }

    getFormDataFromState(state: FormSubmissionState): any {
        const formData = {};
        this.formItems.forEach((item) => {
            Object.assign(formData, item.getFormDataFromState(state));
        });
        return formData;
    }

    getStateFromValidForm(payload: FormPayload): { [key: string]: any } {
        const state = {};
        this.formItems.forEach((item) => {
            Object.assign(state, item.getStateFromValidForm(payload));
        });
        return state;
    }

    getViewModel(
        formData: FormData | FormSubmissionState,
        errors?: FormSubmissionErrors,
        conditions?: AdapterFormModel["conditions"]
    ): ComponentCollectionViewModel {
        const result =
            this.items?.map((item: any) => {
                return {
                    type: item.type,
                    isFormComponent: item.isFormComponent,
                    model: item.getViewModel(formData, errors),
                };
            }) ?? [];
        if (conditions) {
            return result.filter(
                (item) => conditions[item.model?.condition]?.fn(formData) ?? true
            );
        }
        return result;
    }
}
