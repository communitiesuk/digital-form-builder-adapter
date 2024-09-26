import {Given} from "@badeball/cypress-cucumber-preprocessor";

Given("publish the form into runner {string}", (formName) => {
  const url = `${Cypress.env("RUNNER_URL")}/publish`;

  cy.fixture(`../../../../e2e-test/cypress/fixtures/${formName}.json`, "utf-8").then((json) => {
    const requestBody = {
      id: formName,
      configuration: json,
    };
    cy.request("POST", url, requestBody);
  });
});
