import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import FormData from "form-data";
import { Component } from "src/server/plugins/engine/components";
import { AdapterFormModel } from "src/server/plugins/engine/models";
import { AdapterComponentDef } from "@communitiesuk/model";

const lab = Lab.script();
exports.lab = lab;
const { expect } = Code;
const { beforeEach, suite, test } = lab;

suite("Component", () => {
  let model: AdapterFormModel;

  beforeEach(() => {
    model = {} as AdapterFormModel;
  });

  test("should initialize with given definition and model", () => {
    const def: AdapterComponentDef = {
      type: "text",
      name: "myComponent",
      title: "My component",
      schema: {},
      options: {},
    };

    const component = new Component(def, model);

    expect(component.type).to.equal(def.type);
    expect(component.name).to.equal(def.name);
    expect(component.title).to.equal(def.title);
    expect(component.schema).to.equal(def.schema);
    expect(component.options).to.equal(def.options);
    expect(component.hint).to.be.undefined();
    expect(component.content).to.be.undefined();
  });

  test("should set hint and content if provided", () => {
    const def: AdapterComponentDef = {
      type: "text",
      name: "myComponent",
      title: "My component",
      schema: {},
      options: {},
      hint: "a hint",
      content: "some content",
    };

    const component = new Component(def, model);

    expect(component.hint).to.equal(def.hint);
    expect(component.content).to.equal(def.content);
  });

  test("should return default view model", () => {
    const def: AdapterComponentDef = {
      type: "text",
      name: "myComponent",
      title: "My component",
      schema: {},
      options: {},
    };

    const component = new Component(def, model);
    const viewModel = component.getViewModel(new FormData());

    expect(viewModel).to.equal({
      attributes: {},
    });
  });
});
