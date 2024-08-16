import {FormComponent} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components";
import {AdapterComponentDef} from "@communitiesuk/model";
import {AdapterFormModel} from "../models";


export class AdapterFormComponent extends FormComponent {
    constructor(def: AdapterComponentDef, model: AdapterFormModel) {
        //@ts-ignore
        super(def, model);
    }

    getAdditionalValidationFunctions(): Function[] {
        return [];
    }
}
