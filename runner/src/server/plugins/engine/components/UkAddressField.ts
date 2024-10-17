import joi from "joi";

import {InputFieldsComponentsDef} from "@xgovformbuilder/model";
import {ComponentCollection} from "./ComponentCollection";
import {AdapterFormComponent} from "./AdapterFormComponent";
import {AdapterFormModel} from "../models";
import {
    buildStateSchema
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components/helpers";
import {
    FormPayload, FormSubmissionErrors,
    FormSubmissionState
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";

const UK_COUNTIES = {
    England: [
        "Bedfordshire", "Berkshire", "Bristol", "Buckinghamshire", "Cambridgeshire", "Cheshire", "Cornwall", "Cumbria", "Derbyshire", "Devon", "Dorset", "Durham", "East Riding of Yorkshire", "East Sussex", "Essex", "Gloucestershire", "Greater London", "Greater Manchester", "Hampshire", "Herefordshire", "Hertfordshire", "Isle of Wight", "Kent", "Lancashire", "Leicestershire", "Lincolnshire", "Merseyside", "Norfolk", "North Yorkshire", "Northamptonshire", "Northumberland", "Nottinghamshire", "Oxfordshire", "Rutland", "Shropshire", "Somerset", "South Yorkshire", "Staffordshire", "Suffolk", "Surrey", "Tyne and Wear", "Warwickshire", "West Midlands", "West Sussex", "West Yorkshire", "Wiltshire", "Worcestershire"
    ],
    Scotland: [
        "Aberdeenshire", "Angus", "Argyll and Bute", "Ayrshire", "Banffshire", "Berwickshire", "Caithness", "Clackmannanshire", "Dumfries and Galloway", "Dunbartonshire", "East Lothian", "Fife", "Inverness-shire", "Kincardineshire", "Kinross-shire", "Kirkcudbrightshire", "Lanarkshire", "Midlothian", "Moray", "Nairnshire", "Orkney", "Peeblesshire", "Perthshire", "Renfrewshire", "Ross and Cromarty", "Roxburghshire", "Selkirkshire", "Shetland", "Stirlingshire", "Sutherland", "West Lothian", "Wigtownshire"
    ],
    Wales: [
        "Anglesey", "Brecknockshire", "Caernarfonshire", "Cardiganshire", "Carmarthenshire", "Clwyd", "Denbighshire", "Dyfed", "Flintshire", "Glamorgan", "Gwent", "Gwynedd", "Merionethshire", "Monmouthshire", "Montgomeryshire", "Pembrokeshire", "Powys", "Radnorshire", "South Glamorgan", "West Glamorgan"
    ],
    NorthernIreland: [
        "Antrim", "Armagh", "Down", "Fermanagh", "Londonderry", "Tyrone"
    ]
};

export class UkAddressField extends AdapterFormComponent {
    formChildren: ComponentCollection;
    stateChildren: ComponentCollection;

    constructor(def: InputFieldsComponentsDef, model: AdapterFormModel) {
        super(def, model);
        const {name, options} = this;
        const stateSchema = buildStateSchema("date", this);
        const isRequired = !("required" in options && options.required === false);

        let addressLine1Title = model.options.translationEn.components.ukAddressField.addressLine1;
        let addressLine2Title = model.options.translationEn.components.ukAddressField.addressLine1;
        let townCityText = model.options.translationEn.components.ukAddressField.townOrCity;
        let county = model.options.translationEn.components.ukAddressField.county;
        let postcode = model.options.translationEn.components.ukAddressField.postcode;
        let invalidPostCodeError = model.options.translationEn.validation.ukAddressField.invalidPostCodeError;

        if (model.def.metadata?.isWelsh) {
            addressLine1Title = model.options.translationCy.components.ukAddressField.addressLine1;
            addressLine2Title = model.options.translationCy.components.ukAddressField.addressLine1;
            townCityText = model.options.translationCy.components.ukAddressField.townOrCity;
            county = model.options.translationCy.components.ukAddressField.county;
            postcode = model.options.translationCy.components.ukAddressField.postcode;
            invalidPostCodeError = model.options.translationCy.validation.ukAddressField.invalidPostCodeError;
        }

        const childrenList: any = [
            {
                type: "TextField",
                name: "addressLine1",
                title: addressLine1Title,
                schema: {max: 100},
                options: {
                    required: isRequired,
                    classes: "govuk-!-width-full",
                    optionalText: false,
                },
            },
            {
                type: "TextField",
                name: "addressLine2",
                title: addressLine2Title,
                schema: {max: 100, allow: ""},
                options: {required: false, classes: "govuk-!-width-full"},
            },
            {
                type: "TextField",
                name: "town",
                title: townCityText,
                schema: {max: 100},
                options: {
                    required: isRequired,
                    classes: "govuk-!-width-two-thirds",
                    optionalText: false,
                },
            },
            {
                type: "TextField",
                name: "county",
                title: county,
                schema: {max: 100},
                options: {required: false, classes: "govuk-!-width-two-thirds"},
            },
            {
                type: "TextField",
                name: "postcode",
                title: postcode,
                schema: {
                    max: 10,
                    regex:
                        "^([A-Za-z][A-Ha-hJ-Yj-y]?[0-9][A-Za-z0-9]? ?[0-9][A-Za-z]{2}|[Gg][Ii][Rr] ?0[Aa]{2})$",
                },
                options: {
                    required: isRequired,
                    customValidationMessages: {
                        "string.max": invalidPostCodeError,
                        "string.pattern.base": invalidPostCodeError,
                    },
                    classes: "govuk-!-width-one-half",
                    optionalText: false,
                },
            },
        ];

        const stateChildren = new ComponentCollection(childrenList, model);

        // Modify the name to add a prefix and reuse
        // the children to create the formComponents
        childrenList.forEach((child: { name: string; }) => (child.name = `${name}__${child.name}`));

        this.formChildren = new ComponentCollection(childrenList, model);
        this.stateChildren = stateChildren;
        this.stateSchema = stateSchema;
    }

    getFormSchemaKeys() {
        return this.formChildren.getFormSchemaKeys();
    }

    //@ts-ignore
    getStateSchemaKeys() {
        const {name} = this;
        const options: any = this.options;

        return {
            [name]:
                options.required === false
                    ? joi
                        .object()
                        .keys(this.stateChildren.getStateSchemaKeys())
                        .allow(null)
                    : joi
                        .object()
                        .keys(this.stateChildren.getStateSchemaKeys())
                        .required(),
        };
    }

    getFormDataFromState(state: FormSubmissionState) {
        const name = this.name;
        const value = state[name];

        if (typeof value === "string") {
            return this.convertStringAnswers(value, name);
        }
        return {
            [`${name}__addressLine1`]: value && value.addressLine1,
            [`${name}__addressLine2`]: value && value.addressLine2,
            [`${name}__town`]: value && value.town,
            [`${name}__county`]: value && value.county,
            [`${name}__postcode`]: value && value.postcode,
        };
    }

    getStateValueFromValidForm(payload: FormPayload) {
        const name = this.name;
        return payload[`${name}__addressLine1`]
            ? {
                addressLine1: payload[`${name}__addressLine1`],
                addressLine2: payload[`${name}__addressLine2`],
                town: payload[`${name}__town`],
                county: payload[`${name}__county`],
                postcode: payload[`${name}__postcode`],
            }
            : null;
    }

    getDisplayStringFromState(state: FormSubmissionState) {
        const name = this.name;
        const value = state[name];

        if (
            typeof value !== "string" &&
            typeof value !== "undefined" &&
            value !== null
        ) {
            value.addressLine2 =
                value.addressLine2 === "" ? "null" : value.addressLine2;
            value.county = value.county === "" ? "null" : value.county;
        }

        if (typeof value === "string") {
            return value;
        }

        return value
            ? [
                value.addressLine1,
                value.addressLine2,
                value.town,
                value.county,
                value.postcode,
            ]
                .filter((p) => p && p !== "null")
                .join(", ")
            : "";
    }

    //@ts-ignore
    getViewModel(formData: FormData, errors: FormSubmissionErrors) {
        const options: any = this.options;
        const viewModel = {
            //@ts-ignore
            ...super.getViewModel(formData, errors),
            children: this.formChildren.getViewModel(formData, errors),
        };

        viewModel.fieldset = {
            legend: viewModel.label,
        };

        const {disableLookup} = options;

        if (disableLookup !== undefined) {
            viewModel.disableLookup = disableLookup;
        } else {
            viewModel.disableLookup = true;
        }

        return viewModel;
    }

    //@ts-ignore
    isValidCounty(county: string): boolean {
        const lowerCaseCounty = county.toLowerCase();
        return Object.values(UK_COUNTIES).some(region =>
            region.some(c => c.toLowerCase() === lowerCaseCounty)
        );
    }

    // This method is used to solve the issue of the address fields appearing blank when
    // returning to a completed section of a form.
    convertStringAnswers(value: any, name?: string) {
        const prefix = name ? `${name}__` : "";
        // Initialize the address object with empty strings
        const addressObject: any = {
            [`${prefix}addressLine1`]: "",
            [`${prefix}addressLine2`]: "",
            [`${prefix}town`]: "",
            [`${prefix}county`]: "",
            [`${prefix}postcode`]: "",
        };
        if (value !== "" && value !== undefined) {
            const address = value.split(", ");
            if (address.length === 3) {
                // Case: "123 Main St, Sheffield, S1 2AB"
                addressObject[`${prefix}addressLine1`] = address[0];
                addressObject[`${prefix}town`] = address[1];
                addressObject[`${prefix}postcode`] = address[2];
            } else if (address.length === 4) {
                // Case: "123 Main St, Address line 2, Sheffield, S1 2AB" or "123 Main St, Sheffield, County, S1 2AB"
                addressObject[`${prefix}addressLine1`] = address[0];
                addressObject[`${prefix}postcode`] = address[3];

                // Determine if the second field is addressLine2 or town
                if (this.isValidCounty(address[2])) {
                    addressObject[`${prefix}town`] = address[1];
                    addressObject[`${prefix}county`] = address[2];
                } else {
                    addressObject[`${prefix}addressLine2`] = address[1];
                    addressObject[`${prefix}town`] = address[2];
                }
            } else if (address.length === 5) {
                // Case: "123 Main St, Address line 2, Sheffield, County, S1 2AB"
                addressObject[`${prefix}addressLine1`] = address[0];
                addressObject[`${prefix}addressLine2`] = address[1];
                addressObject[`${prefix}town`] = address[2];
                addressObject[`${prefix}county`] = address[3];
                addressObject[`${prefix}postcode`] = address[4];
            }
        }
        return addressObject;
    }
}
