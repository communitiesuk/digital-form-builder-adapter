// Stub window.open for preview links to redirect instead of opening new tabs
Cypress.Commands.add('stubWindowOpen', () => {
  cy.window().then((win) => {
    cy.stub(win, 'open').callsFake((url) => {
      win.location.href = url;
    });
  });
});
import "@testing-library/cypress/add-commands";
import "cypress-file-upload";
