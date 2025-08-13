import { When, Then } from "@badeball/cypress-cucumber-preprocessor";

Then("The back link href is selected is {string}", (href) => {
  cy.findByRole("link", { name: "Go back to previous page" })
    .should("have.attr", "href")
    .and("eq", href);
});
