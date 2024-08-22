
import { PageController } from "./PageController";
import {FormSubmissionErrors} from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";

export class MultiStartPageController extends PageController {
  get viewName() {
    return "multi-start-page";
  }

  //@ts-ignore
  getViewModel(formData: FormData, errors?: FormSubmissionErrors) {
      //@ts-ignore
    const viewModel = super.getViewModel(formData, errors);
    const { showContinueButton, startPageNavigation } = this.pageDef;
    return {
      ...viewModel,
      continueButtonText: showContinueButton && this.pageDef.continueButtonText,
      startPageNavigation,
      isMultiStartPageController: true,
    };
  }
}
