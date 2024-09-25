import {StatusService} from "../../../../digital-form-builder/runner/src/server/services";
import {AdapterCacheService} from "./AdapterCacheService";
import {HapiServer} from "../types";
import {HapiRequest} from "../../../../digital-form-builder/runner/src/server/types";


export class AdapterStatusService extends StatusService {


    cacheService: AdapterCacheService;

    constructor(server: HapiServer) {
        //@ts-ignore
        super(server);
        const {adapterCacheService} = server.services([]);
        this.cacheService = adapterCacheService;
    }

    //@ts-ignore
    async outputRequests(request: HapiRequest) {
        const state = await this.cacheService.getState(request);
        const {callback} = state;
        if (callback) {
            if (callback.callbackUrl) {
                await super.outputRequests(request);
            }
            this.logger.info(`[AdapterStatusService] call back should have a callbackUrl`);
        } else {
            await super.outputRequests(request);
        }
    }
}
