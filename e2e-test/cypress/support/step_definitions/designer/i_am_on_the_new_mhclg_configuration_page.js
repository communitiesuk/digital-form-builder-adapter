import { Given } from "@badeball/cypress-cucumber-preprocessor";

Given("I am on the new mhclg configuration page", () => {
  cy.visit(`${Cypress.env("DESIGNER_URL")}/app/new`);
  cy.findByText("Create a new form");
});
