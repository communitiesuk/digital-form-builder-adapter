import {HapiRequest, HapiResponseToolkit, HapiServer} from "../types";
import {config} from "../plugins/utils/AdapterConfigurationSchema";
// @ts-ignore
import http from "http";
import {get} from "../../../../digital-form-builder/runner/src/server/services/httpService";
import {
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsCommand,
    PutObjectCommand,
    S3Client
} from "@aws-sdk/client-s3";
import {Upload} from "@aws-sdk/lib-storage";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

type Payload = HapiRequest["payload"];

export let bucketName = config.awsBucketName;
export const region = config.awsRegion;

if (process.env.AWS_BUCKET_NAME) {
    bucketName = process.env.AWS_BUCKET_NAME
}

const awsConfig = {region};
let endpointUrl = process.env.AWS_ENDPOINT_OVERRIDE;
if (endpointUrl) {
    //@ts-ignore
    awsConfig.endpoint = endpointUrl;
    //@ts-ignore
    awsConfig.s3ForcePathStyle = true;
    //@ts-ignore
    awsConfig.signatureVersion = process.env.AWS_SIGNATURE_VERSION || "v4";
}
const s3 = new S3Client(awsConfig);

const parsedError = (key: string, error?: string) => {
    return {
        path: key,
        href: `#${key}`,
        name: key,
        text: error,
    };
};

export interface S3Object {
    Key: string;
    Size: number;
}

export class S3UploadService {
    /**
     * Service responsible for uploading files via the FileUploadField. This service has been registered by {@link #createServer}
     */

    logger: HapiServer["logger"];

    constructor(server) {
        this.logger = server.logger;
    }

    get fileSizeLimit() {
        return 5 * 1024 * 1024; // 5mb
    }

    get validFiletypes(): [
        "jpg",
        "jpeg",
        "png",
        "pdf",
        "txt",
        "doc",
        "docx",
        "odt",
        "csv",
        "xls",
        "xlsx",
        "ods"
    ] {
        return [
            "jpg",
            "jpeg",
            "png",
            "pdf",
            "txt",
            "doc",
            "docx",
            "odt",
            "csv",
            "xls",
            "xlsx",
            "ods",
        ];
    }

    fileStreamsFromPayload(payload: Payload) {
        return Object.entries(payload).filter(([_key, value]: [string, any]) => {
            if (value) {
                if (Array.isArray(value)) {
                    return value.every((nv) => !!nv._data && nv._data.length > 1);
                }
                return !!value._data && value._data.length > 1;
            }
            return false;
        });
    }

    async uploadDocuments(locations: any[], prefix: string, metadata) {
        let error: string | undefined;
        let location: string | undefined;
        let originalFilename: string | undefined;

        await this.uploadFilesS3(locations, prefix, metadata).then((result) => {
            result.forEach((doc) => {
                if (typeof doc.error !== "undefined") {
                    error = "Failed to upload file to server:" + doc.error;
                } else {
                    location = `${prefix}/${locations[0].hapi.filename}`;
                    originalFilename = `${locations[0].hapi.filename}`;
                }
            });
        });
        return {location, error, originalFilename};
    }

    parsedDocumentUploadResponse(res: http.IncomingMessage) {
        let error: string | undefined;
        let location: string | undefined;

        switch (res.statusCode) {
            case 201:
                location = res.headers.location;
                break;
            case 413:
                error = 'The selected file for "%s" is too large';
                break;
            case 422:
                error = 'The selected file for "%s" contained a virus';
                break;
            case 400:
                error = "Invalid file type. Upload a PNG, JPG or PDF";
                break;
            default:
                error = "There was an error uploading your file";
        }

        return {
            location,
            error,
        };
    }

    async failAction(_request: HapiRequest, h: HapiResponseToolkit) {
        h.request.pre.filesizeError = true;
        return h.continue;
    }

    async handleUploadRequest(
        request: HapiRequest,
        h: HapiResponseToolkit,
        form?: any
    ) {
        const {adapterCacheService} = request.services([]);
        //@ts-ignore
        const state = await adapterCacheService.getState(request);
        const originalFilenames = state?.originalFilenames ?? {};

        const form_session_identifier =
            state.metadata?.form_session_identifier ?? "";
        const applicationId = state.metadata?.applicationId ?? "";

        const {path} = request.params;
        let files: [string, any][] = [];

        if (form?.pages) {
            const page = form?.pages.find((page) => this.normalisePath(page.path) === this.normalisePath(path));
            if (request.payload !== null) {
                files = this.fileStreamsFromPayload(request.payload);
            }
            const clientSideUploadComponent = page.components.items.find((c) => c.type === "ClientSideFileUploadField");
            if (clientSideUploadComponent && form_session_identifier && request.payload) {
                const {id, path} = request.params;
                const delPath = `${form_session_identifier}/${id}/${path}/${clientSideUploadComponent.name}`;
                const filesToDelete =
                    request.payload[`${clientSideUploadComponent.name}__delete[]`] || [];

                if (Array.isArray(filesToDelete)) {
                    for (const fileKeyToDelete of filesToDelete) {
                        await this.deleteFileS3(`${delPath}/${fileKeyToDelete}`);
                    }
                } else {
                    await this.deleteFileS3(`${delPath}/${filesToDelete}`);
                }
            }
        } else {
            if (request.payload !== null) {
                files = this.fileStreamsFromPayload(request.payload);
            }
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
            let metaData = {
                componentName: key,
            }
            let prefix = applicationId;
            if (form?.pages) {
                const page = form?.pages.find((page) => this.normalisePath(page.path) === this.normalisePath(path));
                let pageTitle = page.title;
                let sectionTitle = page.section?.title ?? "";
                if (page.def.metadata.isWelsh) {
                    pageTitle = encodeURI(pageTitle);
                    sectionTitle = encodeURI(sectionTitle);
                }
                //@ts-ignore
                metaData.page = pageTitle
                //@ts-ignore
                metaData.section = sectionTitle
                const clientSideUploadComponent = page.components.items.find((c) => c.type === "ClientSideFileUploadField");
                if (clientSideUploadComponent) {
                    const {id, path} = request.params;
                    prefix = `${form_session_identifier}/${id}/${path}/${clientSideUploadComponent.name}`;
                }
            }


            if (validFiles.length === values.length) {
                try {
                    const {error, location, originalFilename} = await this.uploadDocuments(
                        validFiles,
                        prefix,
                        metaData
                    );
                    if (location) {
                        request.payload[key] = location;
                        request.payload[`${key}__filename`] = location;
                        originalFilenames[key] = {location, originalFilename};
                    }
                    if (error) {
                        request.pre.errors = [
                            ...(h.request.pre.errors || []),
                            parsedError(key, error),
                        ];
                    }
                } catch (e) {
                    //@ts-ignore
                    if (e.data && e.data.res) {
                        //@ts-ignore
                        const {error} = this.parsedDocumentUploadResponse(e.data.res);
                        request.pre.errors = [
                            ...(h.request.pre.errors || []),
                            parsedError(key, error),
                        ];
                        //@ts-ignore
                    } else if (e.code === "EPIPE") {
                        // ignore this error, it happens when the request is responded to by the doc upload service before the
                        // body has finished being sent. A valid response is still received.
                        request.server.log(
                            ["info", "documentupload"],
                            //@ts-ignore
                            `Ignoring EPIPE response: ${e.message}`
                        );
                    } else {
                        request.server.log(
                            ["error", "documentupload"],
                            //@ts-ignore
                            `Error uploading document: ${e.message}`
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

    downloadDocuments(paths: string[]) {
        const promises = paths.map((path) => get<string>(path, {}));
        return Promise.all(promises);
    }

    async uploadFilesS3(files, filePrefix, metadata) {
        let response = new Array();

        for (const file of files) {
            const uploadParams = {
                Bucket: bucketName,
                Body: file,
                Key: `${filePrefix}/${file.hapi.filename}`,
                ContentType: file.hapi.headers["content-type"],
                Metadata: metadata,
            };
            const command = new Upload({
                client: s3,
                params: uploadParams
            })
            await command.done()
                .then(function (data) {
                    response.push({location: data.Location, error: undefined});
                })
                .catch((err) => {
                    response.push({
                        location: undefined,
                        error: `${err.code}: ${err.message}`,
                    });
                    this.logger.error(`File upload Error`, err);
                });
        }
        return response;
    }

    normalisePath(path: string) {
        return path.replace(/^\//, "").replace(/\/$/, "");
    }

    async listFilesInBucketFolder(
        folderPath: string,
        formSessionId: string
    ): Promise<S3Object[]> {
        let response = new Array();
        const params = {
            Bucket: bucketName,
            Prefix: `${folderPath}/`,
        };
        const command = new ListObjectsCommand(params);
        await s3.send(command).then(function (result) {
            if (!result.Contents || result.Contents.length === 0) {
                response = [];
            } else {
                // @ts-ignore
                response = result.Contents.filter((obj) => !obj.Key.endsWith("/")).map(
                    (obj) => ({
                        FormSessionId: formSessionId,
                        Key: obj.Key!.replace(`${folderPath}/`, ""),
                        Size: obj.Size!,
                    })
                );
            }
        }).catch((err) => {
            response.push({
                location: undefined,
                error: `${err.code}: ${err.message}`,
            });
            this.logger.error(`Cannot get the list of files`, err);
        });
        return response;
    }

    async getFileDownloadUrlS3(key: string) {
        const params = {
            Bucket: bucketName,
            Key: key,
        };
        const command = new GetObjectCommand(params);
        return getSignedUrl(s3, command);
    }

    async getPreSignedUrlS3(key: string) {
        const params = {
            Bucket: bucketName,
            Key: key
        };
        const command = new PutObjectCommand(params);
        return getSignedUrl(s3, command, {expiresIn: 60 * 60});
    }

    async deleteFileS3(key: string) {
        const params = {
            Bucket: bucketName,
            Key: key,
        };
        try {
            const command = new DeleteObjectCommand(params);
            await s3.send(command);
            return true;
        } catch (err) {
            console.error(`Issue when deleting file with key: ${key}`);
            console.error(err);
            return false;
        }
    }
}
