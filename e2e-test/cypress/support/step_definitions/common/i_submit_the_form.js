import { When } from "@badeball/cypress-cucumber-preprocessor";

When("I submit the form adapter", () => {
  cy.findByRole("button", { id: /submit/i, exact: false }).click();
});
