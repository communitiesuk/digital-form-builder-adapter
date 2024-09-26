import {Given} from "@badeball/cypress-cucumber-preprocessor";

Given("loading overridden form json {string} and it exists", (formName) => {
  const url = `${Cypress.env("RUNNER_URL")}/publish`;

  cy.fixture(`../../../../e2e-test/cypress/fixtures/${formName}.json`, "utf-8").then((json) => {
    const requestBody = {
      id: formName,
      configuration: json,
    };
    cy.request("POST", url, requestBody);
  });

  cy.visit(`${Cypress.env("RUNNER_URL")}/${formName}`, {
    failOnStatusCode: false,
  });
});
