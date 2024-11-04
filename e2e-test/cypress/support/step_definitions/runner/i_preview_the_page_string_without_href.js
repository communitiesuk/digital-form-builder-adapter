import { When } from "@badeball/cypress-cucumber-preprocessor";

When("I preview the page {string} without href", (pageName) => {
  cy.findByText(pageName, { ignore: ".govuk-visually-hidden" })
    .closest(".page")
    .within(() => {
      cy.get(`a[title="Preview page"]`).click()
    });
});
