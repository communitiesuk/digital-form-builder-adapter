import {Then, When} from "@badeball/cypress-cucumber-preprocessor";

When("I add child components", (table) => {

  const listItems = table.hashes();

  listItems.forEach(({
                       component,
                       title,
                       options,
                       additional,
                       listItem
                     }) => {

    const optionsObj = JSON.parse(options)

    cy.get('#select-field-types').select(component)
    cy.get('#child-component-field-title').type(title.trim());

    if (additional === "true") {
      cy.get(".govuk-details__summary").click();
      if (component === 'TextField') {
        if (optionsObj.min) {
          cy.get('#child-component-more-settings #field-schema-min').type(optionsObj.min);
        }
        if (optionsObj.max) {
          cy.get('#child-component-more-settings #field-schema-max').type(optionsObj.max);
        }
        if (optionsObj.words) {
          cy.get('#child-component-more-settings #field-schema-maxwords').type(optionsObj.words);
        }
        if (optionsObj.length) {
          cy.get('#child-component-more-settings #field-schema-length').type(optionsObj.length);
        }
      }
      if (component === 'NumberField') {
        if (optionsObj.min) {
          cy.get('#child-component-more-settings #field-schema-min').type(optionsObj.min);
        }
        if (optionsObj.prefix) {
          cy.get('#child-component-more-settings #field-options-prefix').type(optionsObj.prefix);
        }
        if (optionsObj.max) {
          cy.get('#child-component-more-settings #field-schema-max').type(optionsObj.max);
        }
      }
      if (component === 'DatePartsField') {
        if (optionsObj.maxDaysInPast) {
          cy.get('#child-component-more-settings #field-options-maxDaysInPast').type(optionsObj.maxDaysInPast);
        }
        if (optionsObj.maxDaysInFuture) {
          cy.get('#child-component-more-settings #field-options-maxDaysInFuture').type(optionsObj.maxDaysInFuture);
        }
      }
    }
    if (component === 'RadiosField' && listItem) {
      cy.get('#field-options-list').select(listItem)
    }

    cy.get("#child-component-button").click();
  })

});

Then("I see following components in the page", (table) => {
  const listItems = table.hashes();
  listItems.forEach(({
                       component,
                       title
                     }) => {
    cy.contains('label', title).should('exist');
  });
})
