import {
    CheckboxesField as CoreCheckboxesField
  } from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/components";
import { FormData, FormSubmissionErrors } from '@xgovformbuilder/runner/plugins/engine/types';
  
export class CheckboxesField extends CoreCheckboxesField {
    getViewModel(formData: FormData, errors: FormSubmissionErrors) {
        const viewModel = super.getViewModel(formData, errors);
        // Assumes that checkbox values containing commas should be followed by a space (e.g., "Option 1, Option 2").
        // Ensures consistent splitting, as list items are separated by commas without spaces.

        let formDataItems = (formData[this.name] ?? "").split(/,(?!\s)/g);
        viewModel.items = (viewModel.items ?? []).map((item) => ({
          ...item,
          checked: !!formDataItems.find((i) => `${item.value}` === i),
        }));
    
        return viewModel;
    }
  }
  
