import {Options} from "./types/PluginOptions";
import {HapiServer} from "../../types";
import {RegisterFormsApi} from "./api";


const LOGGER_DATA = {
    class: "MainPlugin",
}

export const plugin = {
    name: "@communitiesuk/runner/engine",
    dependencies: "@hapi/vision",
    multiple: true,
    register: async (server: HapiServer, options: Options) => {
        const {configs} = options;
        const {adapterCacheService} = server.services([]);
        let countOk = 0;
        let countError = 0;
        for (const config of configs) {
            try {
                await adapterCacheService.setFormConfiguration(config.id, config, server);
                countOk++;
            } catch (e) {
                countError++;
                console.log({
                    ...LOGGER_DATA,
                    message: `[FORM-CACHE] error occurred while loading a form config`
                })
            }
        }
        console.log({
            ...LOGGER_DATA,
            message: `[FORM-CACHE] number of forms loaded into cache ok[${countOk}] error[${countError}]`
        })
        new RegisterFormsApi().register(server);
    }
};
