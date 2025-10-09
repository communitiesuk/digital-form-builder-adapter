import { When } from "@badeball/cypress-cucumber-preprocessor";

When("I try to create a new form without entering a form name in new UI", () => {
  cy.findByRole("button", { name: "Create" }).click();
});
