import {Then, When} from "@badeball/cypress-cucumber-preprocessor";

When('I enter {string} into the TinyMCE editor {string}', (text, fieldName) => {
  cy.get(`#${fieldName}`).should('exist').then((textarea) => {
    textarea[0].value = text;
    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    textarea[0].dispatchEvent(inputEvent);
  });
});

Then("I checked for any errors {string} exists for TinyMCE editor", (error) => {
  cy.get('#word-count-label-freeTextField').should('have.text', error);
});
