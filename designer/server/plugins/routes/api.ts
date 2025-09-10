import { api as originalApi } from "../../../../digital-form-builder/designer/server/plugins/routes";
import { preAwardApiClient } from "../../lib/preAwardApiClient";
import config from "../../config";
import { ServerRoute, ResponseObject } from "@hapi/hapi";

// Extend the original getFormWithId with Pre-Award API support
export const getFormWithId: ServerRoute = {
  ...originalApi.getFormWithId,
  options: {
    ...originalApi.getFormWithId.options || {},
    handler: async (request, h) => {
      if (config.usePreAwardApi) {
        const { id } = request.params;
        try {
          const formJson = await preAwardApiClient.getFormDraft(id);
          return h.response(formJson).type("application/json");
        } catch (error) {
          request.logger.error("GET /api/{id}/data getFormWithId", error);
          // Fall through to original handler on error
        }
      }
      // Fall back to original handler
      const originalHandler = typeof originalApi.getFormWithId.options === 'function' 
        ? originalApi.getFormWithId.options 
        : originalApi.getFormWithId.options?.handler;
      if (typeof originalHandler === 'function') {
        return originalHandler(request, h);
      }
      return h.response('Handler not found').code(500);
    },
  },
};

// Extend the original putFormWithId with Pre-Award API support
export const putFormWithId: ServerRoute = {
  ...originalApi.putFormWithId,
  options: {
    ...originalApi.putFormWithId.options || {},
    handler: async (request, h) => {
      if (config.usePreAwardApi) {
        const { id } = request.params;
        const { persistenceService } = request.services([]);
        const { Schema } = await import("../../../../digital-form-builder/model/src");
        
        try {
          const { value, error } = Schema.validate(request.payload, {
            abortEarly: false,
          });
          
          if (error) {
            throw new Error("Schema validation failed, reason: " + error.message);
          }
          
          await persistenceService.uploadConfiguration(`${id}`, JSON.stringify(value));
          const formWithName = { ...value, name: id};
          await preAwardApiClient.createOrUpdateForm(id, formWithName);
          
          return h.response({ ok: true }).code(204);
        } catch (err) {
          request.logger.error("Designer Server PUT /api/{id}/data error:", err);
          return h.response({ ok: false, err }).code(401);
        }
      }
      // Fall back to original handler
      const originalHandler = typeof originalApi.putFormWithId.options === 'function' 
        ? originalApi.putFormWithId.options 
        : originalApi.putFormWithId.options?.handler;
      if (typeof originalHandler === 'function') {
        return originalHandler(request, h);
      }
      return h.response({ ok: false, error: 'Handler not found' }).code(500);
    },
  },
};

// Extend the original getAllPersistedConfigurations with Pre-Award API support
export const getAllPersistedConfigurations: ServerRoute = {
  ...originalApi.getAllPersistedConfigurations,
  options: {
    ...originalApi.getAllPersistedConfigurations.options || {},
    handler: async (request, h): Promise<ResponseObject | undefined> => {
      if (config.usePreAwardApi) {
        try {

          const forms = await preAwardApiClient.getAllForms();



          
          const response = forms.map(form => {

            return {
              Key: form.name,
              DisplayName: form.name,
              LastModified: form.updated_at
            };
          });

          return h.response(response).type("application/json");
        } catch (error) {

          request.server.log(["error", "/configurations"], error as Error);
          // Fall through to original handler on error
        }
      }
      // Fall back to original handler
      const originalHandler = typeof originalApi.getAllPersistedConfigurations.options === 'function' 
        ? originalApi.getAllPersistedConfigurations.options 
        : originalApi.getAllPersistedConfigurations.options?.handler;
      if (typeof originalHandler === 'function') {
        return originalHandler(request, h);
      }
      return h.response([]).type("application/json");
    },
  },
};

// Use original log route as-is
export const log = originalApi.log;