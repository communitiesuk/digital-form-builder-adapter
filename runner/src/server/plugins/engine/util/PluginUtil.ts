import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {AdapterFormModel} from "../models/AdapterFormModel";
import {redirectTo} from "./helper";

export class PluginUtil {

    public static normalisePath(path: string) {
        return path.replace(/^\//, "").replace(/\/$/, "");
    }

    public static getStartPageRedirect(
        request: HapiRequest,
        h: HapiResponseToolkit,
        id: string,
        model: AdapterFormModel
    ) {
        const startPage = PluginUtil.normalisePath(model.def.startPage ?? "");
        let startPageRedirect: any;

        if (startPage.startsWith("http")) {
            startPageRedirect = redirectTo(request, h, startPage);
        } else {
            startPageRedirect = redirectTo(request, h, `/${id}/${startPage}`);
        }

        return startPageRedirect;
    }

}
