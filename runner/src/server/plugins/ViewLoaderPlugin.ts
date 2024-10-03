import path from "path";
import resolve from "resolve";
import pluginViews from "../../../../digital-form-builder/runner/src/server/plugins/views";
import {HapiRequest} from "../types";
import {capitalize} from "lodash";
import {config} from "./utils/AdapterConfigurationSchema";

const basedir = path.join(process.cwd(), "..");
const xGovFormsPath = path.resolve(__dirname, "../../../../");

pluginViews.options.path = [
    /**
     * Array of directories to check for nunjucks templates.
     */
    `${path.join(__dirname, "..", "views")}`,
    `${path.join(__dirname, "engine", "views")}`,
    `${path.join(xGovFormsPath, "digital-form-builder/runner/src/server/views")}`,
    `${path.join(xGovFormsPath, "digital-form-builder/runner/src/server/plugins/engine/views/components")}`,
    `${path.join(xGovFormsPath, "digital-form-builder/runner/src/server/plugins/engine/views/partials")}`,
    `${path.dirname(resolve.sync("govuk-frontend", {basedir}))}`,
    `${path.dirname(resolve.sync("govuk-frontend", {basedir}))}/components`,
    `${path.dirname(resolve.sync("hmpo-components"))}/components`,
]
//@ts-ignore
pluginViews.options.context = (request: HapiRequest) => ({
    assetPath: "/assets",
    cookiesPolicy: request?.state?.cookies_policy,
    serviceName: capitalize(config.serviceName),
    feedbackLink: config.feedbackLink,
    pageTitle: config.serviceName + " - GOV.UK",
    analyticsAccount: config.analyticsAccount,
    gtmId1: config.gtmId1,
    gtmId2: config.gtmId2,
    //@ts-ignore
    location: request?.app.location,
    matomoId: config.matomoId,
    matomoUrl: config.matomoUrl,
    BROWSER_REFRESH_URL: config.browserRefreshUrl,
    sessionTimeout: config.sessionTimeout,
    skipTimeoutWarning: false,
    serviceStartPage: config.serviceStartPage || "#",
    privacyPolicyUrl: config.privacyPolicyUrl || "/help/privacy",
    contactUsUrl: config.contactUsUrl,
    cookiePolicyUrl: config.cookiePolicyUrl,
    accessibilityStatementUrl: config.accessibilityStatementUrl,
    phaseTag: config.phaseTag,
    migrationBannerEnabled: config.migrationBannerEnabled,
    navigation: request?.auth.isAuthenticated
        ? [
            {text: request.i18n.__('viewAllApplications'), href: config.multifundDashboard},
            {text: request.i18n.__('signOut'), href: config.logoutUrl},
        ]
        : null,
})

export const ViewLoaderPlugin: any = pluginViews
