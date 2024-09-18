import { Given, When } from "@badeball/cypress-cucumber-preprocessor";

Given("I navigate to the {string} form with session identifier {string}", (formName, session) => {
  cy.visit(`${Cypress.env("RUNNER_URL")}/${formName}?form_session_identifier=${session}`, {
    failOnStatusCode: false,
  });
});
