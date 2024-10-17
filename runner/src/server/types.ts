import yar from "@hapi/yar";
import {
    Request,
    ResponseToolkit,
    Server,
    ResponseObject,
    Lifecycle,
} from "@hapi/hapi";
import {Logger} from "pino";

import {RateOptions} from "../../../digital-form-builder/runner/src/server/plugins/rateLimit";
import {
    NotifyService,
    PayService,
    WebhookService,
} from "../../../digital-form-builder/runner/src/server/services";
import {AdapterCacheService, S3UploadService} from "./services";
import {AdapterStatusService} from "./services";
import {TranslationLoaderService} from "./plugins/engine/service/TranslationLoaderService";

export type Services = (services: string[]) => {
    adapterCacheService: AdapterCacheService;
    notifyService: NotifyService;
    payService: PayService;
    s3UploadService: S3UploadService;
    webhookService: WebhookService;
    adapterStatusService: AdapterStatusService;
    translationLoaderService: TranslationLoaderService;
};

export type RouteConfig = {
    rateOptions?: RateOptions;
    formFileName?: string;
    formFilePath?: string;
    enforceCsrf?: boolean;
};

declare module "@hapi/hapi" {
    // Here we are decorating Hapi interface types with
    // props from plugins which doesn't export @types
    interface Request {
        services: Services; // plugin schmervice
        i18n: {
            __(arg0: string): string;
            // plugin locale
            setLocale(lang: string): void;
            getLocale(request: Request): void;
            getDefaultLocale(): string;
            getLocales(): string[];
        };
        logger: Logger;
        yar: yar.Yar;
    }

    interface Server {
        logger: Logger;
        services: Services; // plugin schmervice
        registerService: (services: any[]) => void; // plugin schmervice
        yar: yar.ServerYar;
    }

    interface ResponseToolkit {
        view: (viewName: string, data?: { [prop: string]: any }) => any; // plugin view
    }

}

export type HapiRequest = Request;
export type HapiResponseToolkit = ResponseToolkit;
export type HapiLifecycleMethod = Lifecycle.Method;
export type HapiServer = Server;
export type HapiResponseObject = ResponseObject;
