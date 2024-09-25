import {When} from "@badeball/cypress-cucumber-preprocessor";

When("I upload the file {string} wait till upload", (filename) => {
  cy.get("input[type=file]").attachFile(filename);
  cy.wait(2000)
  cy.findByRole("button", {name: /continue/i}).click();
});
