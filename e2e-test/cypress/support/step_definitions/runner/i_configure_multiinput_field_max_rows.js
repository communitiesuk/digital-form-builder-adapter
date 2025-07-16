import { When, Then } from "@badeball/cypress-cucumber-preprocessor";

When("I configure maximum rows as {string}", (maxRows) => {
  cy.get("#max-multi-input-field-rows").type(maxRows);
});

When("I click {string}", (buttonText) => {
  cy.findByRole("button", { name: buttonText }).click();
});

Then("I should not see the {string} button", (buttonText) => {
  cy.findByRole("button", { name: buttonText }).should('not.exist');
});

Then("I should see the {string} button", (buttonText) => {
  cy.findByRole("button", { name: buttonText }).should('exist');
});