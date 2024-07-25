import {RegisterPublicApi} from "./api/RegisterPublicApi";

export default {
    plugin: {
        name: "router",
        register: (server: any) => {
            new RegisterPublicApi().register(server);
        }
    },
};
