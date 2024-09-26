import { When } from "@badeball/cypress-cucumber-preprocessor";

When("I see the error {string} for {string} component", (error, fieldName) => {
  cy.findByText("Fix the following errors");
  cy.findByRole("link", { name: error });
});

When("I see the error {string} for {string} component with problem title", (error, fieldName) => {
  cy.findByText("There is a problem");
  cy.findByRole("link", { name: error });
});
