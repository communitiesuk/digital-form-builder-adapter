import {S3UploadService} from "./S3UploadService";
import {HapiRequest, HapiResponseToolkit} from "../types";

export class MockUploadService extends S3UploadService {

    //@ts-ignore
    async uploadDocuments(locations: any[]) {
        const location = `/${locations[0].hapi.filename}`;
        const originalFilename = `${locations[0].hapi.filename}`;
        return {location, undefined, originalFilename};
    }

    async handleUploadRequest(request: HapiRequest, h: HapiResponseToolkit, form?: any): Promise<symbol> {
        return super.handleUploadRequest(request, h, form);
    }
}
