import {RegisterSessionApi} from "../engine/api/RegisterSessionApi";

export function configureInitialiseSessionPlugin(options: { safelist: string[]; }) {
    return {
        plugin: {
            name: "initialiseSession",
            register: async function (server, options) {
                const {safelist} = options;
                options.safelist = safelist
                new RegisterSessionApi().register(server, options)
            },
        },
        options,
    };
}
