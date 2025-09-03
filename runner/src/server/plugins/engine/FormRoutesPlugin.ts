import {RegisterFormAccessApi} from "./api";

const LOGGER_DATA = {
    class: "FormRoutesPlugin",
}

/**
 * This plugin registers all the routes needed for form access.
 * Forms themselves are fetched on-demand from the Pre-Award API.
 */
export const FormRoutesPlugin = {
    plugin: {
        name: "@communitiesuk/runner/form-routes",
        dependencies: "@hapi/vision",
        register: async (server: any) => {
            console.log({
                ...LOGGER_DATA,
                message: `Registering form access routes. Forms will be fetched on-demand from Pre-Award API.`
            });
            
            // Register all form access routes (GET/POST handlers)
            new RegisterFormAccessApi().register(server);
        }
    }
};