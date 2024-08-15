import {ComponentCollection} from "./ComponentCollection";
import {Schema} from "joi";
import {parseISO, format} from "date-fns";
import {AdapterDataType} from "./types";
import {AdapterFormModel} from "../models";
import {AdapterInputFieldsComponentsDef, MultiInputFieldComponent} from "@communitiesuk/model";
import {
    FormPayload, FormSubmissionErrors,
    FormSubmissionState
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {AdapterFormComponent} from "./AdapterFormComponent";

export class MultiInputField extends AdapterFormComponent {
    children: ComponentCollection;
    options: MultiInputFieldComponent["options"];
    //@ts-ignore
    dataType = "multiInput" as AdapterDataType;

    constructor(def: AdapterInputFieldsComponentsDef, model: AdapterFormModel) {
        //@ts-ignore
        super(def, model);
        this.options = def.options;
        //@ts-ignore
        this.children = new ComponentCollection(def.children as any, model);
    }

    getFormSchemaKeys() {
        return this.children.getFormSchemaKeys();
    }

    //@ts-ignore
    getStateSchemaKeys() {
        return {
            [this.name]: this.children.getStateSchemaKeys() as Schema,
        };
    }

    getFormDataFromState(state: FormSubmissionState) {
        return this.children.getFormDataFromState(state);
    }

    getStateValueFromValidForm(payload: FormPayload) {
        return this.children.getStateFromValidForm(payload);
    }

    getPrefix(key: string) {
        const item = this.children.formItems.find((item) => item.name === key);
        //@ts-ignore
        return item && item.options.prefix ? item.options.prefix : "";
    }

    getComponentType(name) {
        const children = this.children.formItems;
        const foundItem = children.find((item) => item.name === name);
        return foundItem ? foundItem.type : undefined;
    }

    getDisplayStringFromState(state: FormSubmissionState) {
        const answers = state[this.name];
        const stringValue = new Array();

        if (answers) {
            for (const answer of answers) {
                if (typeof answer === "string") {
                    stringValue.push(answer);
                    continue;
                }

                const keyToRenderedValue = {};
                for (const [key, value] of Object.entries(answer)) {
                    const componentType = this.getComponentType(key);
                    if (value == null) {
                        keyToRenderedValue[key] = "Not supplied";
                    } else if (componentType == "DatePartsField") {
                        //@ts-ignore
                        keyToRenderedValue[key] = `${format(parseISO(value), "d/MM/yyyy")}`;
                    } else if (componentType == "MonthYearField") {
                        keyToRenderedValue[key] = `${value[`${key}__month`]}/${
                            value[`${key}__year`]
                        }`;
                    } else if (componentType == "YesNoField") {
                        keyToRenderedValue[key] = value ? "Yes" : "No";
                    } else if (componentType == "UkAddressField") {
                        keyToRenderedValue[key] = value
                            ? [
                                //@ts-ignore
                                value.addressLine1,
                                //@ts-ignore
                                value.addressLine2,
                                //@ts-ignore
                                value.town,
                                //@ts-ignore
                                value.county,
                                //@ts-ignore
                                value.postcode,
                            ]
                                .filter((p) => {
                                    return !!p;
                                })
                                .join(", ")
                            : "";
                    } else {
                        keyToRenderedValue[key] = `${this.getPrefix(key)}${value}`;
                    }
                }
                //@ts-ignore
                const sortedNames = this.children.items.map((x) => x.name);
                const outputString = sortedNames
                    .map((name) => keyToRenderedValue[name])
                    .join(" : ");
                stringValue.push(outputString);
            }
        }

        return stringValue;
    }

    // @ts-ignore - eslint does not report this as an error, only tsc
    getViewModel(formData: FormData, errors: FormSubmissionErrors) {
        //@ts-ignore
        const viewModel = super.getViewModel(formData, errors);
        // Use the component collection to generate the subitems
        const componentViewModels = this.children
            .getViewModel(formData, errors)
            .map((vm) => {
                //@ts-ignore
                vm.model.componentType = vm.type;
                return vm.model;
            });

        componentViewModels.forEach((componentViewModel) => {
            // Nunjucks macro expects label to be a string for this component

            if (componentViewModel.errorMessage) {
                componentViewModel.classes += " govuk-input--error";
            }
        });

        return {
            ...viewModel,
            fieldset: {
                legend: viewModel.label,
            },
            items: componentViewModels,
        };
    }
}
