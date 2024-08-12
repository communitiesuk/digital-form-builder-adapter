import {RegisterApi} from "./RegisterApi";
import {HapiRequest, HapiResponseToolkit, HapiServer} from "../../../types";
import {jwtAuthStrategyName} from "../Auth";


export class RegisterS3FileUploadApi implements RegisterApi {
    register(server: HapiServer): void {

        server.route({
            method: "POST",
            path: "/s3/{id}/{pageKey}/{componentKey}/create-pre-signed-url",
            options: {
                auth: jwtAuthStrategyName,
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
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
                //@ts-ignore
                const {filename} = request.payload;
                //@ts-ignore
                const form = request.server.app.forms[id];
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

                const key = `${form_session_identifier}/${id}/${pageKey}/${componentKey}/${filename}`;
                //@ts-ignore
                const url = await s3UploadService.getPreSignedUrlS3(key, metaData);
                return {url};
            },
        });

        server.route({
            method: "GET",
            path: "/s3/{id}/{pageKey}/{componentKey}/download-file",
            options: {
                auth: jwtAuthStrategyName,
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
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
                const {filename} = request.query;

                const key = `${form_session_identifier}/${id}/${pageKey}/${componentKey}/${filename}`;
                const url = await s3UploadService.getFileDownloadUrlS3(key);
                return h.redirect(url);
            },
        });

        server.route({
            method: "DELETE",
            path: "/s3/{id}/{pageKey}/{componentKey}/delete-file-by-key",
            options: {
                auth: jwtAuthStrategyName,
            },
            handler: async (request: HapiRequest, h: HapiResponseToolkit) => {
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
        });

    }
}
