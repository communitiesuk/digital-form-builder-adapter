import {config} from "./server/plugins/utils/AdapterConfigurationSchema";
import * as Sentry from "@sentry/node";
import {NodeOptions} from "@sentry/node";

if (config.sentryDsn) {
    const sentryConfig: NodeOptions = {
        dsn: config.sentryDsn,
        environment: config.copilotEnv || "development" // Use the provided environment or default to "development"
    };
    // Include tracesSampler only if tracesSamplerRate is available
    if (config.sentryTracesSampleRate) {
        sentryConfig.tracesSampler = (samplingContext) => {
			// exclude health-check transactions
			if (samplingContext.normalizedRequest?.url?.endsWith('/health-check')) {
				return 0
			}
			return Number(config.sentryTracesSampleRate);
		}
    }
    console.log(`[SENTRY MONITORING ENABLED] Environment: ${sentryConfig.environment} Sample Rate: ${config.sentryTracesSampleRate} DSN Available`);
    Sentry.init(sentryConfig);
}
