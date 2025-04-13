const nanoid = require("nanoid");
const minute = 60 * 1000;
const {deferConfig} = require("config/defer");
const dotEnv = require("dotenv");
if (process.env.NODE_ENV !== "test") {
  dotEnv.config({path: ".env"});
}

module.exports = {
  /**
   * Initialised sessions
   * Allows a user's state to be pre-populated.
   */
  safelist: ["localhost", "61bca17e-fe74-40e0-9c15-a901ad120eca.mock.pstmn.io"], // Array of hostnames you want to accept when using a session callback. eg "gov.uk".
  initialisedSessionTimeout: minute * 60 * 24 * 28, // Defaults to 28 days. Set the TTL for the initialised session
  initialisedSessionKey: `${nanoid.random(16)}`, // This should be set if you are deploying replicas
  initialisedSessionAlgorithm: "HS512",

  /**
   * Server
   */
  port: 3009,
  env: "development",
  previewMode: false,
  enforceCsrf: true,
  singleRedis: false,
  isE2EModeEnabled: false,

  /**
   * Helper flags
   */
  isProd: deferConfig(function () {
    return this.env === "production";
  }),
  isDev: deferConfig(function () {
    return this.env !== "production";
  }),
  isTest: deferConfig(function () {
    return this.env === "test";
  }),
  isSingleRedis: deferConfig(function () {
    return this.singleRedis === true || this.singleRedis === "true";
  }),

  /**
   * Service
   */
  serviceUrl: "http://localhost:3009", //This is used for redirects back to the runner.
  serviceName: "Access funding",
  serviceStartPage: "",
  privacyPolicyUrl: "",
  feedbackLink: "#", // Used in your phase banner. Can be a URL or more commonly mailto mailto:feedback@department.gov.uk
  phaseTag: "beta", // Accepts "alpha" |"beta" | ""

  /**
   * Session storage
   * Redis integration is optional, but recommended for production environments.
   */
  sessionTimeout: minute * 60 * 24 * 14, // Hopefully avoiding session expiry during a long form

  /**
   * SSL
   */
  rateLimit: true,

  /**
   * Email outputs
   * Email outputs will use notify to send an email to a single inbox. You must configure this for EMAIL outputs.
   * Not to be confused with notify outputs which is configured per form.
   */
  notifyTemplateId: "",
  notifyAPIKey: "",
  fromEmailAddress: "",

  /**
   * API integrations
   */
  // API keys configured within a form may be set like so { "test": "test-key", "production": "prod" }.
  // Control which is used. Accepts "test" | "production" | "".
  apiEnv: "",
  payApiUrl: "https://publicapi.payments.service.gov.uk/v1",

  /**
   * Authentication
   * when setting authEnabled to true, you must configure the rest of the auth options.
   * Currently only oAuth is supported.
   */
  authEnabled: false,
  jwtAuthEnabled: true,
  jwtAuthCookieName: "fsd_user_token",
  jwtRedirectToAuthenticationUrl: "http://localhost:3004/sessions/sign-out",
  logoutUrl: "/logout",
  multifundDashboard: "/account", //This is used to redirect to the multifund dashboard
  basicAuthOn: false,
  overwriteInitialisedSession: true,

  allowUserTemplates: true,

  /**
   * Logging
   */
  logLevel: "info", // Accepts "trace" | "debug" | "info" | "warn" |"error"
  logPrettyPrint: true,
  logRedactPaths: ["req.headers", "req.remoteAddress", "req.remotePort", "res.headers"], // You should check your privacy policy before disabling this. Check https://getpino.io/#/docs/redaction on how to configure redaction paths
  savePerPage: true, // For activation of the save per page feature

  awsBucketName: "paas-s3-broker-prod-lon-443b9fc2-55ff-4c2f-9ac3-d3ebfb18ef5a", // For uploading files to a aws bucket
  awsRegion: "eu-west-2", // The aws buckets region
  migrationBannerEnabled: false,
  eligibilityResultUrl: "",
  ignoreSectionsFromSummary: ["FabDefault"],

  /*sentry configurations*/
  sentryDsn: "",
  sentryTracesSampleRate: "",
  copilotEnv: ""
};
