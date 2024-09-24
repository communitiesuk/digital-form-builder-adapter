import {When} from "@badeball/cypress-cucumber-preprocessor";

When("I upload the file {string} wait till upload and then save and continue with {string}", (filename, isContinue) => {
  cy.get("input[type=file]").attachFile(formName);
  cy.wait(2000)
  if (isContinue && isContinue==="true") {
    cy.findByRole("button", {name: /continue/i}).click();
  }
});
