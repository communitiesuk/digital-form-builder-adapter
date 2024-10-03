import {ValidationOptions} from "joi";
import {HapiRequest} from "../../../types";

/**
 * see @link https://joi.dev/api/?v=17.4.2#template-syntax for template syntax
 */
const messageTemplate = (request: HapiRequest) => {
    return {
        required: `${request.i18n.__('validation.required')}`,
        selectRequired: `${request.i18n.__('validation.selectRequired')}`,
        max: `${request.i18n.__('validation.max')}`,
        min: `${request.i18n.__('validation.min')}`,
        regex: `${request.i18n.__('validation.regex')}`,
        email: `${request.i18n.__('validation.email')}`,
        number: `${request.i18n.__('validation.number')}`,
        numberMin: `${request.i18n.__('validation.numberMin')}`,
        numberMax: `${request.i18n.__('validation.numberMax')}`,
        format: `${request.i18n.__('validation.format')}`,
        maxWords: `${request.i18n.__('validation.maxWords')}`,
        dateRequired: `${request.i18n.__('validation.dateRequired')}`,
        dateFormat: `${request.i18n.__('validation.dateFormat')}`,
        dateMin: `${request.i18n.__('validation.dateMin')}`,
        dateMax: `${request.i18n.__('validation.dateMax')}`,
    }
};

export const validationOptions = (request: HapiRequest): ValidationOptions => {
    return {
        abortEarly: false,
        messages: {
            "string.base": messageTemplate(request).required,
            "string.min": messageTemplate(request).min,
            "string.empty": messageTemplate(request).required,
            "string.max": messageTemplate(request).max,
            "string.email": messageTemplate(request).email,
            "string.regex.base": messageTemplate(request).format,
            "string.maxWords": messageTemplate(request).maxWords,
            "number.base": messageTemplate(request).number,
            "number.empty": messageTemplate(request).required,
            "number.required": messageTemplate(request).required,
            "number.min": messageTemplate(request).numberMin,
            "number.max": messageTemplate(request).numberMax,
            "any.required": messageTemplate(request).selectRequired,
            "any.empty": messageTemplate(request).required,
            "date.base": messageTemplate(request).dateRequired,
            "date.format": messageTemplate(request).dateFormat,
            "date.min": messageTemplate(request).dateMin,
            "date.max": messageTemplate(request).dateMax,
        },
        dateFormat: "iso",
        errors: {
            wrap: {
                label: false,
            },
        },
    }
};
