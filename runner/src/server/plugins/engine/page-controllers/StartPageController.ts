
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
        // call the parent class's makeGetRouteHandler method
        super.makeGetRouteHandler()(request, h);

        const {adapterCacheService} = request.services([]);
        const {num} = request.query;

        // @ts-ignore
        const state = await adapterCacheService.getState(request);

        const formData = this.getFormDataFromState(state, num - 1);
        const viewModel = this.getViewModel(formData, num);

        // if page is start page and we have change requests for the form
        if (state.metadata?.change_requests) {
          // make sure all components on the start page are HTML components
          let allComponentsArePara = true;
          for (let component of viewModel.components) {
              if (component.type !== "Para") {
                  allComponentsArePara = false;
                  break;
              }
          }

          // if all components are HTML components, replace them with a change request message
          if (allComponentsArePara) {
              const title = "<h1 class='govuk-heading-m'>Change requested</h1>";
              const paragraph = "<p class='govuk-body'>We need you to make some changes to parts of this section. You will need to go through the section to:</p>";
              const list = "<ul class='govuk-list govuk-list--bullet govuk-!-margin-bottom-8'><li>amend the parts where a change request has been made</li><li>check your other information</li><li>send the changes back for approval</li></ul>";
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
