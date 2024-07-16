import {FormModel} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/models";
import {Page} from "@xgovformbuilder/model";
import {
    PageControllerBase
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";
import {ControllerNameResolver} from "../page-controllers/ControllerNameResolver";

export class AdapterFormModel extends FormModel {

    constructor(def, options) {
        super(def, options);
    }

    /**
     * instantiates a Page based on {@link Page}
     */
    makePage(pageDef: Page) {
        if (pageDef.controller) {
            const PageController = ControllerNameResolver.getPageController(pageDef.controller);

            if (!PageController) {
                throw new Error(`PageController for ${pageDef.controller} not found`);
            }

            return new PageController(this, pageDef);
        }

        if (this.DefaultPageController) {
            const DefaultPageController = this.DefaultPageController;
            return new DefaultPageController(this, pageDef);
        }

        return new PageControllerBase(this, pageDef);
    }
}
