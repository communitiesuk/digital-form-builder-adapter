import {
    SummaryPageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";
import {AdapterFormModel} from "../models/AdapterFormModel";


export class AdapterSummaryPageController extends SummaryPageController {

    constructor(model: AdapterFormModel, pageDef: any) {
        super(model, pageDef);
        this.model = model;
    }

}
