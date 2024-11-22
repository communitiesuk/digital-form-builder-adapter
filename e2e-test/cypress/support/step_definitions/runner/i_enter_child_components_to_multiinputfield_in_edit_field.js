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

    const isLikelyJSON = listItem.trim().startsWith('{') || listItem.trim().startsWith('[');
    if (component === 'RadiosField' && listItem && !isLikelyJSON) {
      cy.get('#field-options-list').select(listItem)
    } else {
      if (listItem && isLikelyJSON) {
        cy.findByRole("button", {name: "Add a new list"}).click();
        const parsedData = JSON.parse(listItem);
        cy.get("#list-title").type(parsedData.listName);
        cy.findByRole("link", {name: "Add list item"}).click();
        let count = 1;
        parsedData.items.forEach((item) => {
          cy.get("#title").type(item.name);
          cy.get("#value").type(item.value);
          cy.findByTestId("flyout-3").within(() => {
            cy.findByRole("button", {name: "Save"}).click();
          });
          if (count === parsedData.items.length) return;
          cy.findByRole("link", {name: "Add list item"}).click();
          count++;
        })
        cy.findByTestId("flyout-2").within(() => {
          cy.findByRole("button", {name: "Save"}).click();
        });
      }
    }

    cy.get("#child-component-button").click();
  })

});

Then("I see following components in the page", (table) => {
  const listItems = table.hashes();
  listItems.forEach(({
                       component,
                       title,
                       components
                     }) => {
    cy.contains('label', title).should('exist');
    if (components) {
      const parsedData = JSON.parse(components);
      parsedData.items.forEach((item) => {
        cy.contains('label', item.name) // Check if a label contains the name
          .should('exist')      // Assert that it exists
          .and('be.visible');   // Optionally check visibility
      });
    }
  });
})

Then("I need to verify the configurations in given component", (table) => {
  const listItems = table.hashes();
  listItems.forEach(({
                       component,
                       title,
                       options,
                       additional,
                       listItem
                     }) => {
    // Locate the row containing the target value
    cy.get('table tbody tr') // Adjust the selector to match your table rows
      .contains('td', component) // Find the cell containing the target value
      .closest('tr') // Get the closest row containing that cell
      .within(() => {
        cy.get('button').contains('Edit').click(); // Click the Edit button if it exists
      });

    const optionsObj = JSON.parse(options)

    cy.get('#child-component-field-title')
      .invoke('val')
      .then((actualValue) => {
        expect(actualValue).to.include(title.trim());
      });

    if (additional === "true") {
      cy.get(".govuk-details__summary").click();
      if (component === 'TextField') {
        if (optionsObj.min) {
          cy.get('#child-component-more-settings #field-schema-min').invoke('val')
            .then((actualValue) => {
              expect(actualValue).to.include(optionsObj.min);
            });
        }
        if (optionsObj.max) {
          cy.get('#child-component-more-settings #field-schema-max').invoke('val')
            .then((actualValue) => {
              expect(actualValue).to.include(optionsObj.max);
            });
        }
        if (optionsObj.words) {
          cy.get('#child-component-more-settings #field-schema-maxwords').invoke('val')
            .then((actualValue) => {
              expect(actualValue).to.include(optionsObj.words);
            });
        }
        if (optionsObj.length) {
          cy.get('#child-component-more-settings #field-schema-length').invoke('val')
            .then((actualValue) => {
              expect(actualValue).to.include(optionsObj.length);
            });
        }
      }
      if (component === 'NumberField') {
        if (optionsObj.min) {
          cy.get('#child-component-more-settings #field-schema-min').invoke('val')
            .then((actualValue) => {
              expect(actualValue).to.include(optionsObj.min);
            });
        }
        if (optionsObj.prefix) {
          cy.get('#child-component-more-settings #field-options-prefix').invoke('val')
            .then((actualValue) => {
              expect(actualValue).to.include(optionsObj.prefix);
            });
        }
        if (optionsObj.max) {
          cy.get('#child-component-more-settings #field-schema-max').invoke('val')
            .then((actualValue) => {
              expect(actualValue).to.include(optionsObj.max);
            });
        }
      }
      if (component === 'DatePartsField') {
        if (optionsObj.maxDaysInPast) {
          cy.get('#child-component-more-settings #field-options-maxDaysInPast').invoke('val').then((actualValue) => {
            expect(actualValue).to.include(optionsObj.maxDaysInPast);
          });
        }
        if (optionsObj.maxDaysInFuture) {
          cy.get('#child-component-more-settings #field-options-maxDaysInFuture').invoke('val').then((actualValue) => {
            expect(actualValue).to.include(optionsObj.maxDaysInFuture);
          });
        }
      }
    }

    cy.get('button').contains('Update').click(); // Click the Edit button if it exists

  });
});
