import {PageController} from "./PageController";
import {AdapterFormModel} from "../models";


export class ContinuePageController extends PageController {
    // Controller to add continue button
    //@ts-ignore
    summary: ContinuePageController;
    isContinuePageController = true;
    constructor(model: AdapterFormModel, pageDef: any) {
        //@ts-ignore
        super(model, pageDef);
    }

}
