import {Schema as JoiSchema} from "joi";
import {
    ComponentDef,
    ContentComponentsDef,
} from "@xgovformbuilder/model";
import {AdapterInputFieldsComponentsDef, AdapterComponentDef} from "@communitiesuk/model";
import {AdapterFormModel} from "../models/AdapterFormModel";
import {FormSubmissionErrors} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";
import {AdapterDataType} from "./types";
import {ViewModel} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components/types";

export class ComponentBase {

    type: AdapterComponentDef["type"];
    name: AdapterComponentDef["name"];
    title: AdapterComponentDef["title"];
    schema: AdapterComponentDef["schema"];
    options: AdapterComponentDef["options"];
    hint?: AdapterInputFieldsComponentsDef["hint"];
    //@ts-ignore
    content?: ContentComponentsDef["content"];
    /**
     * This is passed onto webhooks, see {@link answerFromDetailItem}
     */
    dataType?: AdapterDataType = "text";
    model: AdapterFormModel;

    /** joi schemas based on a component defined in the form JSON. This validates a user's answer and is generated from {@link ComponentDef} */
    formSchema?: JoiSchema;
    stateSchema?: JoiSchema;

    constructor(def: AdapterComponentDef, model: AdapterFormModel) {
        // component definition properties
        this.type = def.type;
        this.name = def.name;
        this.title = def.title;
        this.schema = def.schema || {};
        this.options = def.options;
        this.hint = "hint" in def ? def.hint : undefined;
        this.content = "content" in def ? def.content : undefined;
        this.model = model;
    }

    /**
     * parses FormData and returns an object provided to a govuk-frontend template to render
     */
    getViewModel(_formData: FormData, _errors?: FormSubmissionErrors): ViewModel {
        return {
            attributes: {},
        };
    }
}
