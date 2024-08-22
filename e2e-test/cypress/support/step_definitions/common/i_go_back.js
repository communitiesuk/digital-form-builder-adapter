import { When } from "@badeball/cypress-cucumber-preprocessor";

When("I go back adapter", () => {
  cy.findByRole("link", { name: "Go back to application overview" }).click();
});
