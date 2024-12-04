import {Then, When} from "@badeball/cypress-cucumber-preprocessor";

When('I enter {string} into the TinyMCE editor {string}', (text, fieldName) => {
  cy.window().then((win) => {
    return new Cypress.Promise((resolve) => {
      const editor = win.tinymce.get(fieldName);
      if (editor) resolve();
    });
  });
  cy.get(`#${fieldName}_ifr`, {timeout: 10000}).should('exist').then(($iframe) => {
    const iframeBody = $iframe.contents().find('body'); // Access the iframe's body
    cy.wrap(iframeBody).clear().type(text); // Clear and type the text
  });
  cy.get(`#${fieldName}_ifr`).then(($iframe) => {
    const iframeBody = $iframe.contents().find('body');
    cy.wrap(iframeBody).should('contain.text', text); // Assert the content
  });
});

Then("I checked for any errors {string} exists for TinyMCE editor", (error) => {
  cy.get('#word-count-label-freeTextField').should('have.text', error);
});
