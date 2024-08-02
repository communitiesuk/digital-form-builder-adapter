import {PageControllerBase} from "./PageControllerBase";

import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {AdapterFormModel} from "../models";

export class PageController extends PageControllerBase {
    constructor(model: AdapterFormModel, pageDef: any) {
        super(model, pageDef);
    }

    /**
     * {@link https://hapi.dev/api/?v=20.1.2#route-options}
     */
    get getRouteOptions(): {
        ext: any;
    } {
        return {
            ext: {
                onPostHandler: {
                    method: (_request: HapiRequest, h: HapiResponseToolkit) => {
                        return h.continue;
                    },
                },
            },
        };
    }

    /**
     * {@link https://hapi.dev/api/?v=20.1.2#route-options}
     */
    get postRouteOptions(): {
        payload?: any;
        ext: any;
    } {
        return {
            payload: {
                output: "stream",
                parse: true,
                maxBytes: Number.MAX_SAFE_INTEGER,
                failAction: "ignore",
            },
            ext: {
                onPreHandler: {
                    method: async (request: HapiRequest, h: HapiResponseToolkit) => {
                        const {adapterUploadService} = request.services([]);
                        //@ts-ignore
                        return adapterUploadService.handleUploadRequest(request, h, this.pageDef);
                    },
                },
                onPostHandler: {
                    method: async (_request: HapiRequest, h: HapiResponseToolkit) => {
                        return h.continue;
                    },
                },
            },
        };
    }
}
