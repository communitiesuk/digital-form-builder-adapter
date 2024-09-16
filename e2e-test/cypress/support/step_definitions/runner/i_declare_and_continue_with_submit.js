import { When } from "@badeball/cypress-cucumber-preprocessor";

When("I declare and continue with submit", () => {
  cy.findByLabelText("Confirm").click();
  cy.findByRole("button", { id: /submit/i }).click();
});
