import {RegisterPublicApi} from "./api";

export default {
    plugin: {
        name: "router",
        register: (server: any) => {
            new RegisterPublicApi().register(server);
        }
    },
};
