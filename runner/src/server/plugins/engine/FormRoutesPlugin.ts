import {HapiServer} from "../../types";
import {RegisterFormsApi} from "./api";

export const FormRoutesPlugin = {
    name: "FormRoutesPlugin",
    dependencies: "@hapi/vision",
    register: async (server: HapiServer) => {
        new RegisterFormsApi().register(server);
    }
};
