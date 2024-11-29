const {defineConfig} = require("cypress");
const webpack = require("@cypress/webpack-preprocessor");
const preprocessor = require("@badeball/cypress-cucumber-preprocessor");
const path = require("path");


console.log("****************** starting e2e ******************")
console.log(`e2e entry : [${path.resolve(__dirname, "../digital-form-builder/e2e")}]\n`)

async function setupNodeEvents(on, config) {
  // This is required for the preprocessor to be able to generate JSON reports after each run, and more,
  await preprocessor.addCucumberPreprocessorPlugin(on, config);
  on(
    "file:preprocessor",
    webpack({
      webpackOptions: {
        resolve: {
          extensions: [".js"],
        },
        module: {
          rules: [
            {
              test: /\.feature$/,
              use: [
                {
                  loader: "@badeball/cypress-cucumber-preprocessor/webpack",
                  options: config,
                },
              ],
            },
          ],
        },
      },
    })
  );
  // Make sure to return the config object as it might have been modified by the plugin
  return config;
}

module.exports = defineConfig({
  e2e: {
    specPattern: [
      "**/*.feature",
    ],
    fixturesFolder: `${path.resolve(__dirname, "../digital-form-builder/e2e/cypress/fixtures")}`,
    setupNodeEvents,
    chromeWebSecurity: false,
    screenshot: true,
    video: false,
    experimentalSessionAndOrigin: true,
  },
  env: {
    /**
     * To override these via CLI, prefix with cypress_
     * e.g: to override `DESIGNER_URL`, set the env var as `cypress_DESIGNER_URL`.
     */
    DESIGNER_URL: "http://localhost:3000",
    FS_BASIC_AUTH_USERNAME: process.env.FS_BASIC_AUTH_USERNAME,
    FS_BASIC_AUTH_PASSWORD: process.env.FS_BASIC_AUTH_PASSWORD,
    ENVIRONMENT: process.env.ENVIRONMENT,
    RUNNER_URL: "http://localhost:3009",
    TAGS: "not @wip"
  },
});
