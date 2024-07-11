import fs from "fs";
import hapi, { ServerOptions } from "@hapi/hapi";

import Scooter from "@hapi/scooter";
import inert from "@hapi/inert";
import Schmervice from "schmervice";
import blipp from "blipp";
import config from "../../../digital-form-builder/runner/src/server/config";

import { configureEnginePlugin } from "../../../digital-form-builder/runner/src/server/plugins/engine";
import { configureRateLimitPlugin } from "../../../digital-form-builder/runner/src/server/plugins/rateLimit";
import { configureBlankiePlugin } from "../../../digital-form-builder/runner/src/server/plugins/blankie";
import { configureCrumbPlugin } from "../../../digital-form-builder/runner/src/server/plugins/crumb";
import { configureInitialiseSessionPlugin } from "../../../digital-form-builder/runner/src/server/plugins/initialiseSession/configurePlugin";

import pluginLocale from "../../../digital-form-builder/runner/src/server/plugins/locale";
import pluginSession from "../../../digital-form-builder/runner/src/server/plugins/session";
import pluginAuth from "../../../digital-form-builder/runner/src/server/plugins/auth";
import pluginViews from "../../../digital-form-builder/runner/src/server/plugins/views";
import pluginApplicationStatus from "../../../digital-form-builder/runner/src/server/plugins/applicationStatus";
import pluginRouter from "../../../digital-form-builder/runner/src/server/plugins/router";
import pluginErrorPages from "../../../digital-form-builder/runner/src/server/plugins/errorPages";
import pluginLogging from "./plugins/logging";
import pluginPulse from "../../../digital-form-builder/runner/src/server/plugins/pulse";
import {
  AddressService,
  CacheService,
  catboxProvider,
  NotifyService,
  PayService,
  StatusService,
  UploadService,
  MockUploadService,
  WebhookService,
} from "../../../digital-form-builder/runner/src/server/services";
import { HapiRequest, HapiResponseToolkit, RouteConfig } from "./types";
import getRequestInfo from "../../../digital-form-builder/runner/src/server/utils/getRequestInfo";
import { pluginQueue } from "../../../digital-form-builder/runner/src/server/plugins/queue";
import { QueueStatusService } from "../../../digital-form-builder/runner/src/server/services/queueStatusService";
import { MySqlQueueService } from "../../../digital-form-builder/runner/src/server/services/mySqlQueueService";
import { PgBossQueueService } from "../../../digital-form-builder/runner/src/server/services/pgBossQueueService";

const serverOptions = (): ServerOptions => {
  const hasCertificate = config.sslKey && config.sslCert;

  const serverOptions: ServerOptions = {
    debug: { request: [`${config.isDev}`] },
    port: config.port,
    router: {
      stripTrailingSlash: true,
    },
    routes: {
      validate: {
        options: {
          abortEarly: false,
        },
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false,
        },
        xss: "enabled",
        noSniff: true,
        xframe: true,
      },
    },
    cache: [{ provider: catboxProvider() }],
  };

  const httpsOptions = hasCertificate
    ? {
        tls: {
          key: fs.readFileSync(config.sslKey),
          cert: fs.readFileSync(config.sslCert),
        },
      }
    : {};

  return {
    ...serverOptions,
    ...httpsOptions,
  };
};

async function createServer(routeConfig: RouteConfig) {
  const server = hapi.server(serverOptions());
  // @ts-ignore
    const { formFileName, formFilePath, options } = routeConfig;

  if (config.rateLimit) {
    await server.register(configureRateLimitPlugin(routeConfig));
  }
  await server.register(pluginLogging);
  await server.register(pluginSession);
  await server.register(pluginPulse);
  await server.register(inert);
  await server.register(Scooter);
  await server.register(
    configureInitialiseSessionPlugin({
      safelist: config.safelist,
    })
  );
  // @ts-ignore
    await server.register(configureBlankiePlugin(config));
  // @ts-ignore
    await server.register(configureCrumbPlugin(config, routeConfig));
  await server.register(Schmervice);
  await server.register(pluginAuth);

  server.registerService([
    CacheService,
    NotifyService,
    PayService,
    WebhookService,
    AddressService,
  ]);
  if (!config.documentUploadApiUrl) {
    server.registerService([
      Schmervice.withName("uploadService", MockUploadService),
    ]);
  } else {
    server.registerService([UploadService]);
  }

  if (config.enableQueueService) {
    const queueType = config.queueType;
    const queueService =
      queueType === "PGBOSS" ? PgBossQueueService : MySqlQueueService;
    server.registerService([
      Schmervice.withName("queueService", queueService),
      Schmervice.withName("statusService", QueueStatusService),
    ]);
  } else {
    // @ts-ignore
      server.registerService(StatusService);
  }

  server.ext(
    "onPreResponse",
    (request: HapiRequest, h: HapiResponseToolkit) => {
      const { response } = request;

      if ("isBoom" in response && response.isBoom) {
        return h.continue;
      }

      if ("header" in response && response.header) {
        response.header("X-Robots-Tag", "noindex, nofollow");

        const WEBFONT_EXTENSIONS = /\.(?:eot|ttf|woff|svg|woff2)$/i;
        if (!WEBFONT_EXTENSIONS.test(request.url.toString())) {
          response.header(
            "cache-control",
            "private, no-cache, no-store, must-revalidate, max-age=0"
          );
          response.header("pragma", "no-cache");
          response.header("expires", "0");
        } else {
          response.header("cache-control", "public, max-age=604800, immutable");
        }
      }
      return h.continue;
    }
  );

  server.ext("onRequest", (request: HapiRequest, h: HapiResponseToolkit) => {
    // @ts-ignore
      const { pathname } = getRequestInfo(request);

    request.app.location = pathname;

    return h.continue;
  });

  await server.register(pluginLocale);
  // @ts-ignore
  await server.register(pluginViews);
  await server.register(// @ts-ignore
    configureEnginePlugin(formFileName, formFilePath, options)
  );
  await server.register(pluginApplicationStatus);
  await server.register(pluginRouter);
  await server.register(pluginErrorPages);
  await server.register(blipp);

  server.state("cookies_policy", {
    encoding: "base64json",
  });

  await server.register(pluginQueue);

  return server;
}

export default createServer;
