import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import { MultiInputField } from "src/server/plugins/engine/components";
import { AdapterInputFieldsComponentsDef, MultiInputFieldComponent } from "@communitiesuk/model";
import { AdapterFormModel } from "src/server/plugins/engine/models";
import { FormSubmissionState, FormPayload } from "../../../../../../digital-form-builder/runner/src/server/plugins/engine/types";

const lab = Lab.script();
exports.lab = lab;
const { expect } = Code;
const { beforeEach, suite, test } = lab;

suite("MultiInputField", () => {
  let model: AdapterFormModel;
  let componentDefinition: AdapterInputFieldsComponentsDef;

  beforeEach(() => {
    model = {
      def: {
        metadata: {}
      }
    } as AdapterFormModel;

    componentDefinition = {
      type: "MultiInputField",
      name: "multiInput",
      options: {},
      children: [],
    };
  });

  test("should create form children with correct structure", () => {
    const multiInputField = new MultiInputField(componentDefinition, model);

    expect(multiInputField.children).to.exist();
    expect(multiInputField.children.items).to.be.an.array();
  });

  test("getFormSchemaKeys should return form schema keys from children", () => {
    const multiInputField = new MultiInputField(componentDefinition, model);
    const schemaKeys = multiInputField.getFormSchemaKeys();

    expect(schemaKeys).to.be.an.object();
  });

  test("getStateSchemaKeys should return state schema keys from children", () => {
    const multiInputField = new MultiInputField(componentDefinition, model);
    const stateSchemaKeys = multiInputField.getStateSchemaKeys();

    expect(stateSchemaKeys).to.be.an.object();
  });

  test("getFormDataFromState should return form data from state", () => {
    const multiInputField = new MultiInputField(componentDefinition, model);
    const state: FormSubmissionState = { multiInput: [] };
    const formData = multiInputField.getFormDataFromState(state);

    expect(formData).to.be.an.object();
  });

  test("getStateValueFromValidForm should return state value from valid form payload", () => {
    const multiInputField = new MultiInputField(componentDefinition, model);
    const payload: FormPayload = { multiInput: [] };
    const stateValue = multiInputField.getStateValueFromValidForm(payload);

    expect(stateValue).to.be.an.object();
  });

  test("getPrefix should return prefix for a given key", () => {
    const multiInputField = new MultiInputField(componentDefinition, model);
    const prefix = multiInputField.getPrefix("someKey");

    expect(prefix).to.be.a.string();
  });

  test("getComponentType should return component type for a given name", () => {
    const multiInputField = new MultiInputField(componentDefinition, model);
    const componentType = multiInputField.getComponentType("someName");

    expect(componentType).to.be.undefined();
  });

  test("getDisplayStringFromState should return display string from state", () => {
    const multiInputField = new MultiInputField(componentDefinition, model);
    const state: FormSubmissionState = { multiInput: [] };
    const displayString = multiInputField.getDisplayStringFromState(state);

    expect(displayString).to.be.an.array();
  });

  test("getViewModel should return view model from form data and errors", () => {
    const multiInputField = new MultiInputField(componentDefinition, model);
    const formData = {};
    const errors = {};
    const viewModel = multiInputField.getViewModel(formData, errors);

    expect(viewModel).to.be.an.object();
  });
});
