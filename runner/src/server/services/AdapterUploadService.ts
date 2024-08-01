import {UploadService} from "../../../../digital-form-builder/runner/src/server/services";
import {HapiRequest, HapiResponseToolkit} from "../types";

export const parsedError = (key: string, error?: string) => {
    return {
        path: key,
        href: `#${key}`,
        name: key,
        text: error,
    };
};

export class AdapterUploadService extends UploadService {

    //@ts-ignore
    async handleUploadRequest(request: HapiRequest, h: HapiResponseToolkit, page: any) {
        const {adapterCacheService} = request.services([]);
        //@ts-ignore
        const state = await adapterCacheService.getState(request);
        const originalFilenames = state?.originalFilenames ?? {};

        let files: [string, any][] = [];

        if (request.payload !== null) {
            files = this.fileStreamsFromPayload(request.payload);
        }

        /**
         * If there are no valid file(buffer)s, reassign any empty buffers with empty string
         * allows bypassing of file upload for whatever reason it doesn't work.
         */
        if (!files.length && request.payload) {
            const fields = Object.entries(request.payload);

            for (const [key, value] of fields) {
                if (value._data) {
                    const originalFilename = originalFilenames[key];
                    request.payload[key] =
                        (originalFilename && originalFilename.location) || "";
                }
            }

            return h.continue;
        }

        /**
         * files is an array of tuples containing key and value.
         * value may be an array of file data where multiple files have been uploaded
         */

        for (const file of files) {
            const key = file[0];
            const previousUpload = originalFilenames[key] || {};

            let values: any;

            if (Array.isArray(file[1])) {
                values = file[1];
            } else {
                values = [file[1]];
            }

            const validFiles = (
                await Promise.all(
                    values.map(async (fileValue) => {
                        const extension = fileValue.hapi.filename.split(".").pop();
                        if (
                            !this.validFiletypes.includes((extension || "").toLowerCase())
                        ) {
                            request.pre.errors = [
                                ...(h.request.pre.errors || []),
                                parsedError(
                                    key,
                                    `The selected file for "%s" must be a ${this.validFiletypes
                                        .slice(0, -1)
                                        .join(", ")} or ${this.validFiletypes.slice(-1)}`
                                ),
                            ];
                            return null;
                        }
                        try {
                            return fileValue;
                        } catch (e) {
                            request.pre.errors = [
                                ...(h.request.pre.errors || []),
                                //@ts-ignore
                                parsedError(key, e),
                            ];
                        }
                    })
                )
            ).filter((value) => !!value);

            if (validFiles.length === values.length) {
                try {
                    const {error, location, warning} = await this.uploadDocuments(
                        validFiles
                    );
                    if (location) {
                        originalFilenames[key] = {location};
                        request.payload[key] = location;
                        request.pre.warning = warning;
                    }
                    if (error) {
                        request.pre.errors = [
                            ...(h.request.pre.errors || []),
                            parsedError(key, error),
                        ];
                    }
                } catch (e) {
                    //@ts-ignore
                    if (e.data?.res) {
                        //@ts-ignore
                        const {error} = this.parsedDocumentUploadResponse(e.data);
                        request.pre.errors = [
                            ...(h.request.pre.errors || []),
                            parsedError(key, error),
                        ];
                        //@ts-ignore
                    } else if (e.code === "EPIPE") {
                        // ignore this error, it happens when the request is responded to by the doc upload service before the
                        // body has finished being sent. A valid response is still received.
                        //@ts-ignore
                        request.server.log(["info", "documentupload"], `Ignoring EPIPE response: ${e.message}`
                        );
                    } else {
                        //@ts-ignore
                        request.server.log(["error", "documentupload"], `Error uploading document: ${e.message}`
                        );
                        request.pre.errors = [
                            ...(h.request.pre.errors || []),
                            //@ts-ignore
                            parsedError(key, e),
                        ];
                    }
                }
            } else {
                request.payload[key] = previousUpload.location || "";
            }

            if (request.pre.errors && request.pre.errors.length) {
                delete request.payload[key];
            }
        }

        //@ts-ignore
        await adapterCacheService.mergeState(request, {originalFilenames});

        return h.continue;
    }

}
