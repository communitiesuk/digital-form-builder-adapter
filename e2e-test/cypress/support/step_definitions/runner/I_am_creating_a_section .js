import { Then } from "@badeball/cypress-cucumber-preprocessor";

Then("I am creating a section title {string} and name {string}", (sectionTitle, sectionName) => {
  cy.contains('a', 'Add section').click();
  cy.get('#section-title').type(sectionTitle);
  cy.get('#section-name').clear().type(sectionName);
  cy.findByRole("button", { name: "Save" }).click();
  cy.findByText("Close").click();
});

Then("I am adding the section to the page {string} and section {string}", (pageName, sectionName) => {
  cy.get('#page-section').select(sectionName);
  cy.findByRole("button", { name: "Save" }).click();
});
