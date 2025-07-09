const {defineConfig} = require("cypress");
const webpack = require("@cypress/webpack-preprocessor");
const preprocessor = require("@badeball/cypress-cucumber-preprocessor");
const path = require("path");
const AWS = require('aws-sdk');


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

  on('task', {
    async tagAllS3Objects({ tags }) {
      console.log('tagAllS3Objects task started with tags:', tags);
      const s3 = new AWS.S3({
        endpoint: 'http://localhost:4566',
        s3ForcePathStyle: true,
        accessKeyId: 'FSDIOSFODNN7EXAMPLE',
        secretAccessKey: 'fsdlrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'eu-west-2',
      });
      try {
        const listedObjects = await s3.listObjectsV2({ Bucket: 'fsd-bucket' }).promise();
        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
          const msg = `No objects found in bucket fsd-bucket`;
          console.log(msg);
          return msg;
        }
        const taggingPromises = listedObjects.Contents.map((obj) => {
          console.log(`Tagging object: ${obj.Key}`);
          return s3.putObjectTagging({
            Bucket: 'fsd-bucket',
            Key: obj.Key,
            Tagging: {
              TagSet: Object.entries(tags).map(([Key, Value]) => ({ Key, Value })),
            },
          }).promise();
        });
        await Promise.all(taggingPromises);
        const successMsg = `${listedObjects.Contents.length} object(s) in fsd-bucket tagged successfully.`;
        console.log(successMsg);
        return successMsg;
      } catch (error) {
        console.error("Error tagging S3 objects:", error);
        throw error;
      }
    },
  });

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
    RUNNER_URL: "http://localhost:3009",
    TAGS: "not @wip"
  },
});
