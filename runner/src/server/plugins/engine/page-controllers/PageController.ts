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
                        const {s3UploadService} = request.services([]);
                        //@ts-ignore
                        return s3UploadService.handleUploadRequest(request, h, this.pageDef);
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

    makeGetRouteHandler() {
        return async (request: HapiRequest, h: HapiResponseToolkit) => {
            // Call the parent class's makeGetRouteHandler method and get the response
            const parentResponse = await super.makeGetRouteHandler()(request, h);

            const {adapterCacheService} = request.services([]);

            // @ts-ignore
            const state = await adapterCacheService.getState(request);

            // Extract the viewModel from the parent's response
            const viewModel = parentResponse.source.context;

            viewModel.changeRequests = [];
            const changeRequests = state.metadata?.change_requests;
            if (changeRequests && Object.keys(changeRequests).length > 0) {
                for (let componentName in changeRequests) {
                    const messages = changeRequests[componentName];

                    // Find the component with the matching the change request
                    const pageComponents = this.pageDef.components;
                    const component = pageComponents.find(component => {
                        return component.name === componentName
                    });

                    if (component) {
                        // Add an object to viewModel.changeRequests
                        viewModel.changeRequests.push({
                            title: component.title,
                            messages: messages
                        });
                    }
                }
            }

            return h.view(this.viewName, viewModel);
        };
    }
}
