import path from "path";
import { camelCase, upperFirst } from "lodash";
import {
    DobPageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";
import {
    HomePageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";
import {
    PageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";
import {
    StartDatePageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";
import {
    StartPageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";
import {
    SummaryPageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";
import {
    PageControllerBase
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers";
import {
    RepeatingFieldPageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers/RepeatingFieldPageController";
import { Page } from "@xgovformbuilder/model";
import {
    UploadPageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers/UploadPageController";
import {
    MultiStartPageController
} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/pageControllers/MultiStartPageController";
import { ContinuePageController } from "./ContinuePageController";
import { ConfirmPageController } from "./ConfirmPageController";

const PageControllers = {
    DobPageController,
    HomePageController,
    ContinuePageController,
    ConfirmPageController,
    PageController,
    StartDatePageController,
    StartPageController,
    SummaryPageController,
    PageControllerBase,
    RepeatingFieldPageController,
    UploadPageController,
    MultiStartPageController
};

export const controllerNameFromPath = (filePath: string) => {
    const fileName = path.basename(filePath).split(".")[0];
    return `${upperFirst(camelCase(fileName))}PageController`;
};

/**
 * Gets the class for the controller defined in a {@link Page}
 */
export const getPageController = (nameOrPath: Page["controller"]) => {
    const isPath = !!path.extname(nameOrPath);
    const controllerName = isPath
        ? controllerNameFromPath(nameOrPath)
        : nameOrPath;

    return PageControllers[controllerName ?? "PageControllerBase"];
};
