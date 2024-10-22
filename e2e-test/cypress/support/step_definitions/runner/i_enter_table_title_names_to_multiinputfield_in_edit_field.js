import {When} from "@badeball/cypress-cucumber-preprocessor";

When("I continue create a component", (table) => {
  const {
    page,
    component,
    title,
  } = table.hashes()[0];
  cy.findByText(page, {ignore: ".govuk-visually-hidden"})
    .closest(".page")
    .within(() => {
      cy.findByRole("button", {name: "Create component"}).click();
    });
  cy.findByRole("link", {name: component}).click();
  cy.findByRole("textbox", {name: "Title"}).type(title);
})

When("I save component", () => {
  cy.findByRole("button", {name: "Save"}).click();
})

When("I download the configuration", () => {
  cy.findByRole("button", {name: "Download form"}).click();
})

When("I wanted see page json", () => {
  cy.findByRole("button", {name: "Summary"}).click();
  cy.findByRole("button", {name: "JSON"}).click();
})

When("I add table title name {string}", (tableTitle) => {
  cy.get('input[name="table-title"]').type(tableTitle);
  cy.findByRole("button", {name: "Add"}).click();
  cy.get('input[name="table-title"]').clear()
});

When("I add table title {string}", (tableTitle) => {
  cy.get('input[name="tableTitle"]').type(tableTitle);
});

When("I add following controller into the page {string}", (controllerName)=>{
  cy.get('#page-type').select(controllerName)
  cy.findByRole("button", {name: "Save"}).click();
})
