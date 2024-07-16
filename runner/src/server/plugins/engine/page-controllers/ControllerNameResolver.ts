import path from "path";
import {camelCase, upperFirst} from "lodash";
import {
    HomePageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";
import {
    PageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";
import {
    StartPageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";
import {
    PageControllerBase
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";
import {
    RepeatingFieldPageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers/RepeatingFieldPageController";
import {Page} from "@xgovformbuilder/model";
import {
    UploadPageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers/UploadPageController";
import {
    MultiStartPageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers/MultiStartPageController";
import {ContinuePageController} from "./ContinuePageController";
import {ConfirmPageController} from "./ConfirmPageController";
import {AdapterSummaryPageController} from "./AdapterSummaryPageController";

export class ControllerNameResolver {

    private static pageControllers = {
        HomePageController,
        ContinuePageController,
        ConfirmPageController,
        PageController,
        StartPageController,
        AdapterSummaryPageController,
        PageControllerBase,
        RepeatingFieldPageController,
        UploadPageController,
        MultiStartPageController
    };


    public static controllerNameFromPath = (filePath: string) => {
        const fileName = path.basename(filePath).split(".")[0];
        return `${upperFirst(camelCase(fileName))}PageController`;
    };

    /**
     * Gets the class for the controller defined in a {@link Page}
     */
    public static getPageController = (nameOrPath: Page["controller"]) => {
        const isPath = !!path.extname(nameOrPath);
        const controllerName = isPath
            ? ControllerNameResolver.controllerNameFromPath(nameOrPath)
            : nameOrPath;

        return ControllerNameResolver.pageControllers[controllerName ?? "PageControllerBase"];
    };

}


