import {HapiServer} from "../../../types";
import {Options} from "../types/PluginOptions";

export interface RegisterApi {
    /**
     * Register HapiServer an API
     * @param server hapi server instance
     * @param options
     */
    register(server: HapiServer, options?: Options): void;
}
