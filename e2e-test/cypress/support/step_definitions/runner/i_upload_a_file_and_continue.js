import {When} from "@badeball/cypress-cucumber-preprocessor";

When("I upload the file {string} wait till upload", (filename) => {
  cy.get("input[type=file]").attachFile(filename, { force: true });
  cy.wait(5000);
  const tags = {
    GuardDutyMalwareScanStatus: 'NO_THREATS_FOUND'
  };
  cy.task('tagAllS3Objects', { tags }).then(() => {
    cy.wait(5000);
    cy.log('tagAllS3Objects task completed');
    cy.findByRole("button", { name: /continue/i }).click();
  });
});
