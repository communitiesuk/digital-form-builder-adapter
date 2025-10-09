import {RegisterApi} from "./RegisterApi";
import {HapiRequest, HapiResponseToolkit, HapiServer} from "../../../types";
import {jwtAuthStrategyName} from "../Auth";
import {config} from "../../utils/AdapterConfigurationSchema";
import {getNamespaceFromRequest} from "../../../services/AdapterCacheService";

const GUARD_DUTY_MALWARE_SCAN_STATUS = 'GuardDutyMalwareScanStatus';
const THREATS_FOUND = 'THREATS_FOUND';
const NO_THREATS_FOUND = "NO_THREATS_FOUND";

export class RegisterS3FileUploadApi implements RegisterApi {
    register(server: HapiServer): void {

        const s3PresignUrlOption: any = {
            method: "POST",
            path: "/s3/{id}/{pageKey}/{componentKey}/create-pre-signed-url",
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {
                    //@ts-ignore
                    s3UploadService, adapterCacheService, form_session_identifier, id, pageKey, componentKey
                } = await this.extractRequestData(request, h);
                //@ts-ignore
                const {filename} = request.payload;
                request.logger.info(`[RegisterS3FileUploadApi] uploading the file ${filename}`);
                
                // Determine namespace - preview users and applicants both need to upload files
                const namespace = getNamespaceFromRequest(request);
                //@ts-ignore
                const form = await adapterCacheService.getFormAdapterModel(id, request, namespace);
                const page = form?.pages.find(
                    (p) =>
                        s3UploadService.normalisePath(p.path) ===
                        s3UploadService.normalisePath(pageKey)
                );
                const metaData = {
                    page: encodeURI(page.title),
                    section: encodeURI(page.section?.title ?? ""),
                    componentName: componentKey,
                };
                request.logger.info(`[RegisterS3FileUploadApi] meta data ${JSON.stringify(metaData)}`);
                const key = `${form_session_identifier}/${id}/${pageKey}/${componentKey}/${filename}`;
                //@ts-ignore
                const url = await s3UploadService.getPreSignedUrlS3(key, metaData);
                return {url};
            },
        }

        if (config.jwtAuthEnabled && config.jwtAuthEnabled === "true") {
            s3PresignUrlOption.options = {
                auth: jwtAuthStrategyName
            }
        }

        server.route(s3PresignUrlOption);


        const s3GetDataOptions: any = {
            method: "GET",
            path: "/s3/{id}/{pageKey}/{componentKey}/download-file",
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {
                    //@ts-ignore
                    s3UploadService, form_session_identifier, id, pageKey, componentKey
                } = await this.extractRequestData(request, h);
                //@ts-ignore
                const {filename} = request.query;

                const key = `${form_session_identifier}/${id}/${pageKey}/${componentKey}/${filename}`;
                const url = await s3UploadService.getFileDownloadUrlS3(key);
                return h.redirect(url);
            },
        }

        if (config.jwtAuthEnabled && config.jwtAuthEnabled === "true") {
            s3GetDataOptions.options = {
                auth: jwtAuthStrategyName
            }
        }

        server.route(s3GetDataOptions);

        const s3CheckTagsAndDelete: any = {
            method: "POST",
            path: "/s3/{id}/{pageKey}/{componentKey}/check-tags-and-delete",
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {
                    //@ts-ignore
                    s3UploadService, form_session_identifier, id, pageKey, componentKey
                } = await this.extractRequestData(request, h);
                //@ts-ignore
                const {filename} = request.payload;

                const key = `${form_session_identifier}/${id}/${pageKey}/${componentKey}/${filename}`;
                if (config.enableVirusScan === "true") {
                    const tagsForTheFile = await s3UploadService.getFileTagsS3(key);
                    const malwareScanTag = tagsForTheFile.tags.find(tag => tag.Key === GUARD_DUTY_MALWARE_SCAN_STATUS);
                    if (malwareScanTag && malwareScanTag.Value === THREATS_FOUND) {
                        await s3UploadService.deleteFileS3(key);
                    }
                    return tagsForTheFile;
                } else {
                    // Local development purposes we ignore using actual Guard-duty service
                    return {
                        tags: [
                            {
                                Key: GUARD_DUTY_MALWARE_SCAN_STATUS,
                                Value: NO_THREATS_FOUND
                            }
                        ]
                    };
                }
            },
        }

        if (config.jwtAuthEnabled && config.jwtAuthEnabled === "true") {
            s3CheckTagsAndDelete.options = {
                auth: jwtAuthStrategyName
            }
        }

        server.route(s3CheckTagsAndDelete);

        const deleteOptions: any = {
            method: "DELETE",
            path: "/s3/{id}/{pageKey}/{componentKey}/delete-file-by-key",
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
                const {
                    //@ts-ignore
                    s3UploadService, form_session_identifier, id, pageKey, componentKey
                } = await this.extractRequestData(request, h);
                //@ts-ignore
                const {filename} = request.payload;

                const key = `${form_session_identifier}/${id}/${pageKey}/${componentKey}/${filename}`;
                const wasDeleted = s3UploadService.deleteFileS3(key);
                //@ts-ignore
                if (wasDeleted) {
                    return h.response("File deleted from S3").code(200);
                } else {
                    return h.response("Error deleting file from S3").code(500);
                }
            },
        }

        if (config.jwtAuthEnabled && config.jwtAuthEnabled === "true") {
            deleteOptions.options = {
                auth: jwtAuthStrategyName
            }
        }

        server.route(deleteOptions);

    }

    private async extractRequestData(request: HapiRequest, h: HapiResponseToolkit) {
        const {query} = request;
        const {s3UploadService, adapterCacheService} = request.services([]);
        //@ts-ignore
        const state = await adapterCacheService.getState(request);
        let form_session_identifier = state.metadata?.form_session_identifier ?? "";
        if (query.form_session_identifier) {
            form_session_identifier = query.form_session_identifier;
        }
        if (!form_session_identifier) {
            return h.response({ok: false}).code(401);
        }
        const {id, pageKey, componentKey} = request.params as any;

        return {
            s3UploadService,
            adapterCacheService,
            form_session_identifier,
            id,
            pageKey,
            componentKey
        };
    }
}