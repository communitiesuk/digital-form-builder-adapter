import { api as originalApi } from "../../../../digital-form-builder/designer/server/plugins/routes";
import { preAwardApiClient } from "../../lib/preAwardApiClient";
import { ServerRoute, ResponseObject } from "@hapi/hapi";

// Extend the original getFormWithId with Pre-Award API support
export const getFormWithId: ServerRoute = {
  ...originalApi.getFormWithId,
  options: {
    ...originalApi.getFormWithId.options || {},
    handler: async (request, h) => {
      const { id } = request.params;
      const formJson = await preAwardApiClient.getFormDraft(id);
      return h.response(formJson).type("application/json");
    },
  },
};

// Extend the original getAllPersistedConfigurations with Pre-Award API support
export const getAllPersistedConfigurations: ServerRoute = {
  ...originalApi.getAllPersistedConfigurations,
  options: {
    ...originalApi.getAllPersistedConfigurations.options || {},
    handler: async (request, h): Promise<ResponseObject | undefined> => {
      const forms = await preAwardApiClient.getAllForms();
      return h.response(forms).type("application/json");
    },
  },
};

// Use original log route as-is
export const log = originalApi.log;
