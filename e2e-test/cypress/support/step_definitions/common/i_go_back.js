import { When } from "@badeball/cypress-cucumber-preprocessor";

When("I go back to previous page", () => {
  cy.findByRole("link", { name: "Go back to previous page" }).click();
});
