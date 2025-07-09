import {When} from "@badeball/cypress-cucumber-preprocessor";

When("I upload the file {string} with virus then wait till upload", (filename) => {
  cy.get("input[type=file]").attachFile(filename);
  cy.wait(5000);
  const tags = {
    GuardDutyMalwareScanStatus: 'THREATS_FOUND'
  };
  cy.task('tagAllS3Objects', { tags }).then(() => {
    cy.wait(5000);
    cy.log('tagAllS3Objects task completed');
  });
});
