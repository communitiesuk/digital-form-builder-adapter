import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import { ComponentCollection } from "src/server/plugins/engine/components";
import { AdapterFormModel } from "src/server/plugins/engine/models";
import { AdapterComponentDef } from "@communitiesuk/model";
import * as Components from "src/server/plugins/engine/components/index";
import joi from "joi";

const lab = Lab.script();
exports.lab = lab;
const { expect } = Code;
const { beforeEach, suite, test } = lab;

suite("ComponentCollection", () => {
  let model: AdapterFormModel;
  let componentDefinition: AdapterComponentDef[];

  beforeEach(() => {
    model = {
      // Add necessary mock properties and methods for AdapterFormModel
    } as AdapterFormModel;

    componentDefinition = [
      { type: "MockComponent", name: "mockComponent" }
    ];

    (Components as any).MockComponent = class {
      isFormComponent = true;
      getFormSchemaKeys = () => ({ mockKey: joi.string() });
      getStateSchemaKeys = () => ({ mockKey: joi.string() });
      getAdditionalValidationFunctions = () => [() => {}];
      getFormDataFromState = () => ({ mockKey: "mockValue" });
      getStateFromValidForm = () => ({ mockKey: "mockValue" });
      getViewModel = () => ({ type: "MockComponent", model: {} });
    };
  });

  test("should initialize with given components and model", () => {
    const collection = new ComponentCollection(componentDefinition, model);
    expect(collection.items.length).to.equal(1);
    expect(collection.formItems.length).to.equal(1);
  });

  test("should generate form schema keys", () => {
    const collection = new ComponentCollection(componentDefinition, model);
    const formSchemaKeys = collection.getFormSchemaKeys();
    expect(formSchemaKeys).to.be.an.object();
    expect(formSchemaKeys).to.include({ mockKey: joi.string() });
  });

  test("should generate state schema keys", () => {
    const collection = new ComponentCollection(componentDefinition, model);
    const stateSchemaKeys = collection.getStateSchemaKeys();
    expect(stateSchemaKeys).to.be.an.object();
    expect(stateSchemaKeys).to.include({ mockKey: joi.string() });
  });

  test("should get all additional validation functions", () => {
    const collection = new ComponentCollection(componentDefinition, model);
    const validationFunctions = collection.getAllAdditionalValidationFunctions();
    expect(validationFunctions.length).to.equal(1);
  });


  test("should get form data from state", () => {
    const collection = new ComponentCollection(componentDefinition, model);
    const formData = collection.getFormDataFromState({} as any);
    expect(formData).to.be.an.object();
    expect(formData).to.include({ mockKey: "mockValue" });
  });

  test("should get state from valid form", () => {
    const collection = new ComponentCollection(componentDefinition, model);
    const state = collection.getStateFromValidForm({} as any);
    expect(state).to.be.an.object();
    expect(state).to.include({ mockKey: "mockValue" });
  });

  test("should get view model", () => {
    const collection = new ComponentCollection(componentDefinition, model);
    const viewModel = collection.getViewModel({} as any);
    expect(viewModel).to.be.an.array();
    expect(viewModel.length).to.equal(1);
    expect(viewModel[0].model).to.include({ type: "MockComponent" });
  });
});
