import * as Code from "@hapi/code";
import * as Lab from "@hapi/lab";
//@ts-ignore
import { ControllerNameResolver } from "server/plugins/engine/page-controllers/ControllerNameResolver";
//@ts-ignore
import * as PageControllers from "server/plugins/engine/page-controllers";

const lab = Lab.script();
exports.lab = lab;
const { expect } = Code;
const { describe, suite, test } = lab;

suite("Engine Page Controllers ControllerNameResolver.getPageController", () => {
  describe("controllerNameFromPath", () => {
    test("controller name is extracted correctly", () => {
      const filePath = "./pages/summary.js";
      const controllerName = ControllerNameResolver.controllerNameFromPath(filePath);
      expect(controllerName).to.equal("SummaryPageController");
    });

    test("kebab-case is pascal-case", () => {
      const filePath = "./pages/dob.js";
      const controllerName = ControllerNameResolver.controllerNameFromPath(filePath);
      expect(controllerName).to.equal("DobPageController");
    });
  });

  describe("ControllerNameResolver.getPageController", () => {
    test("it returns DobPageController when a legacy path is passed", () => {
      const controllerFromPath = ControllerNameResolver.getPageController("./pages/dob.js");
      expect(controllerFromPath).to.equal(PageControllers.DobPageController);

      const controllerFromName = ControllerNameResolver.getPageController("DobPageController");
      expect(controllerFromName).to.equal(PageControllers.DobPageController);
    });

    test("it returns HomePageController when a legacy path is passed", () => {
      const controllerFromPath = ControllerNameResolver.getPageController("./pages/home.js");
      expect(controllerFromPath).to.equal(PageControllers.HomePageController);

      const controllerFromName = ControllerNameResolver.getPageController("HomePageController");
      expect(controllerFromName).to.equal(PageControllers.HomePageController);
    });

    test("it returns StartDatePageController when a legacy path is passed", () => {
      const controllerFromPath = ControllerNameResolver.getPageController("./pages/start-date.js");
      expect(controllerFromPath).to.equal(
        PageControllers.StartDatePageController
      );

      const controllerFromName = ControllerNameResolver.getPageController("StartDatePageController");
      expect(controllerFromName).to.equal(
        PageControllers.StartDatePageController
      );
    });

    test("it returns StartPageController when a legacy path is passed", () => {
      const controllerFromPath = ControllerNameResolver.getPageController("./pages/start.js");
      expect(controllerFromPath).to.equal(PageControllers.StartPageController);

      const controllerFromName = ControllerNameResolver.getPageController("StartPageController");
      expect(controllerFromName).to.equal(PageControllers.StartPageController);
    });

    test("it returns SummaryPageController when a legacy path is passed", () => {
      const controllerFromPath = ControllerNameResolver.getPageController("./pages/summary.js");
      expect(controllerFromPath).to.equal(
        PageControllers.SummaryPageController
      );

      const controllerFromName = ControllerNameResolver.getPageController("SummaryPageController");
      expect(controllerFromName).to.equal(
        PageControllers.SummaryPageController
      );
    });
  });
});
