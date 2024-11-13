import { Then } from "@badeball/cypress-cucumber-preprocessor";

Then("I see the exact heading {string}", (string) => {
  cy.get(".page__heading h3")
    .invoke("contents") // Gets all content inside h3, including nodes
    .then((elements) => {
      // Filter out any nodes that are span elements
      const text = Cypress._.map(elements, (el) => {
        return el.nodeType === Node.TEXT_NODE ? el.textContent.trim() : "";
      }).join(""); // Join all filtered text nodes
      expect(text).to.include(string); // Check if the filtered text includes "Start"
    });
});
