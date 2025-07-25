import { When, Then } from "@badeball/cypress-cucumber-preprocessor";

When("I see the error {string} for {string} component", (error, fieldName) => {
  cy.findByText("There is a problem");
  cy.findByRole("link", { name: error });
});

When("I see the error {string} for component {string}", (error, fieldName) => {
  cy.findByText("There is a problem");
  cy.findByRole("link", { name: error });
  cy.findByRole("group", { description: `Error: ${error}` });
});

Then(
  "I see the date parts with a error string {string} for {string}",
  (error, fieldName) => {
    cy.findByText("There is a problem");
    cy.get(`#${fieldName}-error`).within(() => {
      cy.findByText(error, { exact: false });
    });
  }
);

Then("I see the date parts with error {string}", (error) => {
  cy.findByText("There is a problem");
  cy.findByRole("link", { name: error, exact: false });
});

When("I see the error {string} for {string} component with problem title", (error, fieldName) => {
  cy.findByText("There is a problem");
  cy.findByRole("link", { name: error });
});
