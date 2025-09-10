import { newConfig as originalNewConfig } from "../../../../digital-form-builder/designer/server/plugins/routes";
import { preAwardApiClient } from "../../lib/preAwardApiClient";
import config from "../../config";
import { ServerRoute } from "@hapi/hapi";
import { HapiRequest } from "../../../../digital-form-builder/designer/server/types";
import { nanoid } from "nanoid";
import newFormJson from "../../../../digital-form-builder/designer/new-form.json";

// Extend the original registerNewFormWithRunner with Pre-Award API support
export const registerNewFormWithRunner: ServerRoute = {
  ...originalNewConfig.registerNewFormWithRunner,
  options: {
    ...originalNewConfig.registerNewFormWithRunner.options,
    handler: async (request: HapiRequest, h) => {
      const { selected, name } = request.payload as any;
      
      if (name && name !== "" && !name.match(/^[a-zA-Z0-9 _-]+$/)) {
        return h
          .response("Form name should not contain special characters")
          .type("application/json")
          .code(400);
      }
      
      const newName = name === "" ? nanoid(10) : name;
      
      if (selected.Key === "New") {
        const formWithName = { ...newFormJson, name: newName };
        await preAwardApiClient.createOrUpdateForm(newName, formWithName);
      } else {
        const existingForm = await preAwardApiClient.getFormDraft(selected.Key);
        const formWithNewName = { ...existingForm, name: newName };
        await preAwardApiClient.createOrUpdateForm(newName, formWithNewName);
      }
      
      const response = JSON.stringify({
        id: `${newName}`,
        previewUrl: config.previewUrl,
      });
      return h.response(response).type("application/json").code(200);
    },
  },
};
