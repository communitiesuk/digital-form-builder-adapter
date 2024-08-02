import {RegisterApplicationStatusApi} from "../api";


const index = {
    plugin: {
        name: "applicationStatus",
        dependencies: "@hapi/vision",
        multiple: true,
        register: (server) => {
            new RegisterApplicationStatusApi().register(server)
        },
    },
};

export default index;
