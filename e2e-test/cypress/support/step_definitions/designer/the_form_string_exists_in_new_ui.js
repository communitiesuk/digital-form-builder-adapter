import { Given } from "@badeball/cypress-cucumber-preprocessor";

Given("the form {string} exists in new UI", (formName) => {
  const url = `${Cypress.env("FORM_STORE_API_HOST")}`;

  cy.fixture(`${formName}.json`, "utf-8").then((json) => {
    const requestBody = {
      url_path: formName,
      display_name: formName,
      form_json: json,
    };
    cy.request("POST", url, requestBody);
  });
});
