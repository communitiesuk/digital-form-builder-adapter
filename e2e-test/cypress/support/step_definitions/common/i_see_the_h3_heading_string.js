import { Then } from "@badeball/cypress-cucumber-preprocessor";

Then("I see the h3 heading {string}", (string) => {
  cy.get('h3').contains(string);
});
