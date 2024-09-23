import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
import { AdapterFormComponent } from "src/server/plugins/engine/components";
import { AdapterComponentDef } from "@communitiesuk/model";
import { AdapterFormModel } from "src/server/plugins/engine/models";

const lab = Lab.script();
exports.lab = lab;
const { expect } = Code;
const { beforeEach, suite, test } = lab;

suite("AdapterFormComponent", () => {
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

    const component = new AdapterFormComponent(def, model);

    expect(component.type).to.equal(def.type);
    expect(component.name).to.equal(def.name);
    expect(component.title).to.equal(def.title);
    expect(component.schema).to.equal(def.schema);
    expect(component.options).to.equal(def.options);
  });

  test("should return empty array for additional validation functions", () => {
    const def: AdapterComponentDef = {
      type: "text",
      name: "myComponent",
      title: "My component",
      schema: {},
      options: {},
    };

    const component = new AdapterFormComponent(def, model);
    const additionalValidationFunctions = component.getAdditionalValidationFunctions();

    expect(additionalValidationFunctions).to.be.an.array().and.to.have.length(0);
  });
});
