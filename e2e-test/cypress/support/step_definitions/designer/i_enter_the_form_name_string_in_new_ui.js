import { nanoid } from "nanoid";
import { When } from "@badeball/cypress-cucumber-preprocessor";

When("I force open the link {string} in new UI", (urlPath) => {
  cy.stubWindowOpen();
  cy.get('td:nth-child(2)').filter((index, el) => el.textContent.trim() === urlPath).parent('tr').find('td:nth-child(4) a').click({ force: true });
});

When("I enter the form name {string} in new UI", (string) => {
  cy.findByRole("textbox", { name: "Display name" }).type(`${string}-${nanoid(5)}`);
});

When("I try to create a new form without entering a form name in new UI", () => {
  cy.findByRole("button", { name: "Create" }).click();
});