import {Then, When} from "@badeball/cypress-cucumber-preprocessor";

When('I enter {string} into the TinyMCE editor {string}', (text, fieldName) => {
  cy.get(`#${fieldName}:hidden`).invoke('val', text);
});

Then("I checked for any errors {string} exists for TinyMCE editor", (error) => {
  cy.get('#word-count-label-freeTextField').should('have.text', error);
});
