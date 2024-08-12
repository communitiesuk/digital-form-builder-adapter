import {HapiServer} from "../types"
import {RegisterS3FileUploadApi} from "./engine/api/RegisterS3FileUploadApi";

export default {
    plugin: {
        name: "clientSideUploadPlugin",
        register: (server: HapiServer) => {
            new RegisterS3FileUploadApi().register(server)
        },
    },
};
