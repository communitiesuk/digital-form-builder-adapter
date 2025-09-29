import { newConfig as originalNewConfig } from "../../../../digital-form-builder/designer/server/plugins/routes";
import { preAwardApiClient } from "../../lib/preAwardApiClient";
import config from "../../config";
import { ServerRoute } from "@hapi/hapi";
import { HapiRequest } from "../../../../digital-form-builder/designer/server/types";
import newFormJson from "../../../../digital-form-builder/designer/new-form.json";

// Extend the original registerNewFormWithRunner with Pre-Award API support
export const registerNewFormWithRunner: ServerRoute = {
  ...originalNewConfig.registerNewFormWithRunner,
  options: {
    ...originalNewConfig.registerNewFormWithRunner.options,
    handler: async (request: HapiRequest, h) => {
      const { selected, displayName, urlPath } = request.payload as any;
      
      // Validate display name
      if (!displayName || displayName.trim() === "") {
        return h
          .response("Display name is required")
          .type("application/json")
          .code(400);
      }

      // Validate URL path
      if (!urlPath || urlPath.trim() === "") {
        return h
          .response("URL path is required")
          .type("application/json")
          .code(400);
      }
      
      if (!urlPath.match(/^[a-zA-Z0-9_-]+$/)) {
        return h
          .response("URL path should only contain letters, numbers, hyphens and underscores")
          .type("application/json")
          .code(400);
      }

      // Check if URL path already exists
      try {
        const existingForms = await preAwardApiClient.getAllForms();
        const urlPathExists = existingForms.some(
          form => form.url_path.toLowerCase() === urlPath.toLowerCase()
        );

        if (urlPathExists) {
          return h
            .response("A form with this URL path already exists")
            .type("application/json")
            .code(400);
        }
      } catch (error) {
        request.logger.error("Error checking existing forms:", error);
        // Continue anyway - better to allow creation than block on error
      }

      const trimmedDisplayName = displayName.trim();
      const trimmedUrlPath = urlPath.trim();
      
      try {
        if (selected.Key === "New") {
          const formData = { 
            url_path: trimmedUrlPath, 
            display_name: trimmedDisplayName, 
            form_json: newFormJson 
          };
          await preAwardApiClient.createOrUpdateForm(formData);
        } else {
          // Copying from existing form
          const existingForm = await preAwardApiClient.getFormDraft(selected.Key);
          const formData = { 
            url_path: trimmedUrlPath, 
            display_name: trimmedDisplayName, 
            form_json: existingForm 
          };
          await preAwardApiClient.createOrUpdateForm(formData);
        }
        
        const response = JSON.stringify({
          id: trimmedUrlPath,
          previewUrl: config.previewUrl,
        });
        return h.response(response).type("application/json").code(200);
      } catch (error) {
        request.logger.error("Error creating/updating form:", error);
        return h
          .response("An error occurred while creating the form. Please try again.")
          .type("application/json")
          .code(500);
      }
    },
  },
};
