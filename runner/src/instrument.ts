import {config} from "./server/plugins/utils/AdapterConfigurationSchema";
import * as Sentry from "@sentry/node";
import {NodeOptions} from "@sentry/node";

if (config.sentryDsn) {
    const sentryConfig: NodeOptions = {
        dsn: config.sentryDsn, // Replace with your Sentry DSN
        environment: config.sentryEnv || "development" // Use the provided environment or default to "development"
    };
    // Include tracesSampleRate only if it's available
    if (config.sentryTracesSampleRate) {
        sentryConfig.tracesSampleRate = Number(config.sentryTracesSampleRate);
    }
    console.log(`[SENTRY MONITORING ENABLED] Environment: ${sentryConfig.environment} Sample Rate: ${sentryConfig.tracesSampleRate} DSN Available`);
    Sentry.init(sentryConfig);
}
