import path from "path";
import {camelCase, upperFirst} from "lodash";
import {ContinuePageController} from "./ContinuePageController";
import {ConfirmPageController} from "./ConfirmPageController";
import {SummaryPageController} from "./SummaryPageController";
import {StartPageController} from "./StartPageController";
import {PageController} from "./PageController";
import {PageControllerBase} from "./PageControllerBase";
import {AdapterPage} from "@communitiesuk/model";

export class ControllerNameResolver {

    private static pageControllers = {
        ContinuePageController,
        ConfirmPageController,
        PageController,
        StartPageController,
        AdapterSummaryPageController: SummaryPageController,
        PageControllerBase,
        SummaryPageController,
    };


    public static controllerNameFromPath = (filePath: string) => {
        const fileName = path.basename(filePath).split(".")[0];
        return `${upperFirst(camelCase(fileName))}PageController`;
    };

    /**
     * Gets the class for the controller defined in a {@link Page}
     */
    public static getPageController = (nameOrPath: AdapterPage["controller"]) => {
        const isPath = !!path.extname(nameOrPath);
        const controllerName = isPath
            ? ControllerNameResolver.controllerNameFromPath(nameOrPath)
            : nameOrPath;
        return ControllerNameResolver.pageControllers[controllerName ?? "PageControllerBase"];
    };

}


