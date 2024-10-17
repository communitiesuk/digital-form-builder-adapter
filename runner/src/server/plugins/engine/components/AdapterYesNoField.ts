import {YesNoField} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components";
import {InputFieldsComponentsDef} from "@xgovformbuilder/model";
import {AdapterFormModel} from "../models";


export class AdapterYesNoField extends YesNoField {

    constructor(def: InputFieldsComponentsDef, model: AdapterFormModel) {
        super(def, model);
        this.list.items[0].text = model.options.translationEn.components.yesOrNoField.yes;
        this.list.items[1].text = model.options.translationEn.components.yesOrNoField.no;
        if (model.def.metadata?.isWelsh) {
            this.list.items[0].text = model.options.translationCy.components.yesOrNoField.yes;
            this.list.items[1].text = model.options.translationCy.components.yesOrNoField.no;
        }
    }
}
