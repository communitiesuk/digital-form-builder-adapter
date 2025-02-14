
import { PageController } from "./PageController";

import {HapiRequest, HapiResponseToolkit} from "../../../types";
import {FormSubmissionErrors, FormData} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";

export class StartPageController extends PageController {
  /**
   * The controller which is used when Page["controller"] is defined as "./pages/start.js"
   * This page should not be used in production. This page is helpful for prototyping start pages within the app,
   * but start pages should really live on gov.uk (whitehall publisher) so a user can be properly signposted.
   */

  getViewModel(formData: FormData, errors?: FormSubmissionErrors) {
    return {
      ...super.getViewModel(formData, errors),
      isStartPage: true,
      skipTimeoutWarning: true,
    };
  }

  makeGetRouteHandler() {
    return async (request: HapiRequest, h: HapiResponseToolkit) => {
        // Call the parent class's makeGetRouteHandler method and get the response
        const parentResponse = await super.makeGetRouteHandler()(request, h)
        const {adapterCacheService} = request.services([]);

        // @ts-ignore
        const state = await adapterCacheService.getState(request);

        // Extract the viewModel from the parent's response
        const viewModel = parentResponse.source.context;
        const changeRequests = state.metadata?.change_requests;

        // if page is start page and we have change requests for the form
        if (changeRequests && Object.keys(changeRequests).length > 0) {
          // make sure all components on the start page are HTML components
          let allComponentsAreParaOrHtml = true;
          for (let component of viewModel.components) {
              if (component.type !== "Para" && component.type !== "Html") {
                allComponentsAreParaOrHtml = false;
                  break;
              }
          }

          // if all components are HTML components, replace them with a change request message
          if (allComponentsAreParaOrHtml) {
            const titleText = this.model.translationEn.components.changeRequestpage.title;
            const subtitleText = this.model.translationEn.components.changeRequestpage.subtitle;
            const itemOneText = this.model.translationEn.components.changeRequestpage.itemOne;
            const itemTwoText = this.model.translationEn.components.changeRequestpage.itemTwo;
            const itemThreeText = this.model.translationEn.components.changeRequestpage.itemThree;

            const title = `<h1 class='govuk-heading-m'>${titleText}</h1>`;
            const paragraph = `<p class='govuk-body'>${subtitleText}</p>`;
            const list = `<ul class='govuk-list govuk-list--bullet govuk-!-margin-bottom-8'><li>${itemOneText}</li><li>${itemTwoText}</li><li>${itemThreeText}</li></ul>`;
            const changeRequestMessage = title + paragraph + list

            viewModel.components = [{
                type: "Para",
                isFormComponent: true,
                model: {
                    attributes: {},
                    content: changeRequestMessage
                }
            }];
          }
      }

      return h.view(this.viewName, viewModel);
    };
  }
}
