import {StatusService} from "../../../../digital-form-builder/runner/src/server/services";
import {AdapterCacheService} from "./AdapterCacheService";
import {HapiServer} from "../types";


export class AdapterStatusService extends StatusService {


    cacheService: AdapterCacheService;

    constructor(server: HapiServer) {
        //@ts-ignore
        super(server);
        const {adapterCacheService} = server.services([]);
        this.cacheService = adapterCacheService;
    }

}
