import {AdapterFormComponent} from "../components";
import {PageController} from "./PageController";
import {PlaybackUploadPageController} from "./PlaybackUploadPageController";
import {AdapterFormModel} from "../models";
import {HapiRequest, HapiResponseToolkit} from "../../../types";


function isUploadField(component: AdapterFormComponent) {
  return component.type === "FileUploadField";
}

export class UploadPageController extends PageController {
  playback: PlaybackUploadPageController;
  inputComponent: AdapterFormComponent;
  constructor(model: AdapterFormModel, pageDef: any) {
    super(model, pageDef);
    //@ts-ignore
    const inputComponent = this.components?.items?.find(isUploadField);
    if (!inputComponent) {
      throw Error(
        "UploadPageController initialisation failed, no file upload component was found"
      );
    }
    this.playback = new PlaybackUploadPageController(
      model,
      pageDef,
      inputComponent as AdapterFormComponent
    );
    this.inputComponent = inputComponent as AdapterFormComponent;
  }

  makeGetRouteHandler() {
    return async (request: HapiRequest, h: HapiResponseToolkit) => {
      const { query } = request;
      const { view } = query;

      if (view === "playback") {
        return this.playback.makeGetRouteHandler()(request, h);
      }

      return super.makeGetRouteHandler()(request, h);
    };
  }

  makePostRouteHandler() {
    return async (request: HapiRequest, h: HapiResponseToolkit) => {
      const { query } = request;

      if (query?.view === "playback") {
        return this.playback.makePostRouteHandler()(request, h);
      }

      const defaultRes = super.makePostRouteHandler()(request, h);

      if (request.pre?.warning) {
        return h.redirect("?view=playback");
      }

      return defaultRes;
    };
  }
}
