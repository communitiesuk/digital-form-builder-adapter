import { Given } from "@badeball/cypress-cucumber-preprocessor";

Given("the form {string} exists in new UI", (formName) => {
  const formStoreUrl = `${Cypress.env("FORM_STORE_API_HOST")}`;
  const runnerUrl = `${Cypress.env("RUNNER_URL")}/publish`;
  const { v4: uuidv4 } = require('uuid');

  cy.fixture(`${formName}.json`, "utf-8").then((json) => {
    // Post to Form Store API
    const formStoreRequestBody = {
      url_path: formName,
      display_name: formName,
      form_json: json,
    };
    cy.request("POST", formStoreUrl, formStoreRequestBody);

    // Post to Runner API for publishing
    const runnerRequestBody = {
      id: formName,
      configuration: json,
    };
    cy.request("POST", runnerUrl, runnerRequestBody);
  });

  // Visit the form to make it available for preview
  cy.visit(`${Cypress.env("RUNNER_URL")}/${formName}?form_session_identifier=preview/${uuidv4()}`, {
    failOnStatusCode: false,
  });
});
