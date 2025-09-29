import { api as originalApi } from "../../../../digital-form-builder/designer/server/plugins/routes";
import { preAwardApiClient } from "../../lib/preAwardApiClient";
import { ServerRoute, ResponseObject } from "@hapi/hapi";

// Extend the original getFormWithId with Pre-Award API support
export const getFormWithId: ServerRoute = {
  ...originalApi.getFormWithId,
  options: {
    ...originalApi.getFormWithId.options,
    handler: async (request, h) => {
      const { id } = request.params;
      const formDraftResponse = await preAwardApiClient.getFormDraft(id);
      return h.response(formDraftResponse).type("application/json");
    },
  },
};

// Extend the original getAllPersistedConfigurations with Pre-Award API support
export const getAllPersistedConfigurations: ServerRoute = {
  ...originalApi.getAllPersistedConfigurations,
  options: {
    ...originalApi.getAllPersistedConfigurations.options,
    handler: async (request, h): Promise<ResponseObject | undefined> => {
      const forms = await preAwardApiClient.getAllForms();
      const response = forms.map(form => ({
        Key: form.url_path,
        DisplayName: form.display_name,
        LastModified: form.updated_at,
        LastPublished: form.published_at
      }));
      return h.response(response).type("application/json");
    },
  },
};

export const publishForm: ServerRoute = {
  method: "PUT",
  path: "/api/{id}/publish",
  options: {
    handler: async (request, h) => {
      const { id } = request.params;
      try {
        await preAwardApiClient.publishForm(id);
        return h.response({ ok: true }).code(200);
      } catch (error) {
        request.logger.error("Error publishing form:", error);
        return h.response({ ok: false, error: "Failed to publish form" }).code(500);
      }
    },
  },
};

// Use original log route as-is
export const log = originalApi.log;
