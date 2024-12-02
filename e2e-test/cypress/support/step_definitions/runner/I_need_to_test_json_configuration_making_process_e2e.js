import {Before, When} from "@badeball/cypress-cucumber-preprocessor";

Cypress.Commands.add('saveAndSetCookies', (targetUrl) => {
  cy.getCookies().then((cookies) => {
    cookies.forEach((cookie) => {
      cy.setCookie(cookie.name, cookie.value, {
        domain: ".levellingup.gov.uk",
        path: "/",
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite
      });
    });
    cy.visit(targetUrl);
  });
});

Before(() => {
  cy.session('userSession', () => {
    if (Cypress.env("FS_BASIC_AUTH_USERNAME") && Cypress.env("FS_BASIC_AUTH_PASSWORD")) {
      const authUrlWithAuth = Cypress.env("AUTH_URL")
      const frontendUrlWithAuth = Cypress.env("FRONTEND_URL")
      const workAroundFrontendLogin = `${frontendUrlWithAuth}/funding-round/hsra/r1`;
      cy.visit(workAroundFrontendLogin);
      const workAroundLogin = `${authUrlWithAuth}/service/magic-links/new?fund=hsra&round=r1`;
      cy.visit(workAroundLogin);
      cy.get("#email").type("sample@gg.com");
      cy.findByRole("button", {name: "Continue"}).click();
      cy.request('GET', `${authUrlWithAuth}/magic-links`)
        .then((response) => {
          cy.log(response)
          expect(response.status).to.eq(200);
          if (!response.body.length >= 1) {
            throw new Error("No magic links available");
          }
          let linkId = null
          for (let i = 0; i < response.body.length; i++) {
            if (response.body[i].startsWith("link:")) {
              linkId = response.body[i].slice(5);
              break;
            }
          }
          if (linkId !== null) {
            cy.intercept(`*`, (req) => {
              req.headers['authorization'] = 'Basic ' + btoa(`${Cypress.env("FS_BASIC_AUTH_USERNAME")}:${Cypress.env("FS_BASIC_AUTH_PASSWORD")}`);
            }).as('allRequests');
            cy.visit(`${authUrlWithAuth}/service/magic-links/landing/${linkId}?fund=hsra&round=r1`);
            cy.get('a[role="button"][data-module="govuk-button"]').click();
            cy.getCookies().should('have.length.greaterThan', 0);  // Ensure at least one cookie is present
            cy.getCookie('fsd_user_token').should('exist');  // Assert that fsd_user_token exists
            cy.getCookie('fsd_user_token').should('have.property', 'value').and('not.be.empty');  // Ensures the cookie has a value
          }
        });
    }
  });
});

When('I am deleting all the pages from the template', (table) => {
  const listItems = table.hashes();
  listItems.forEach(({page}) => {
    cy.get(`div#\\${convertToSlug(page)}`)
      .should('exist')
      .within(() => {
        cy.findByRole("button", {name: "Edit page"}).click({force: true});
      });
    cy.findByTestId("flyout-0").should('exist').and('be.visible').within(() => {
      cy.findByRole("button", {name: "Delete"}).click();
    });
  });
});

When('I am trying to create {string} page {string}', (pageType, pageTitle) => {
  cy.findByRole("button", {name: "Add page"}).click();
  cy.findByTestId("flyout-0").within(() => {
    if (pageType === "Summary page") {
      cy.get('#page-type').select("./pages/summary.js")
    }
    cy.get('#page-title').type(pageTitle);
    cy.findByRole("button", {name: "Save"}).click();
  });

});

When('I am creating the links for the page {string} to {string}', (pageFrom, pageTo) => {
  cy.findByRole("button", {name: "Add link"}).click();
  cy.findByTestId("flyout-0").should('exist').and('be.visible').within(() => {
    cy.get('#link-source').select(convertToSlug(pageFrom))
    cy.get('#link-target').select(convertToSlug(pageTo))
    cy.findByRole("button", {name: "Save"}).click();
  });
});

When('I am creating components on the page {string}', (page, table) => {
  const listItems = table.hashes();
  listItems.forEach(({name, type, title, options, hint}) => {
    cy.wait(100);
    cy.get(`div#\\${convertToSlug(page)}`)
      .should('exist')
      .within(() => {
        cy.findByRole("button", {name: "Create component"}).click({force: true});
      });
    cy.findByTestId("flyout-0").should('exist').and('be.visible').within(() => {
      cy.findByRole("link", {name: type}).click();
      if (type === "Paragraph") {
        cy.get("#field-content").type(title);
      } else if (type === "Text") {
        cy.get("#field-title").type(title);
        if (hint) {
          cy.get("#field-hint").type(hint);
        }
      } else if (type === "YesNo") {
        cy.get("#field-title").type(title);
      } else if (type === "Multi Input Field") {
        cy.get("#field-title").type(title);
        if (hint) {
          cy.get("#field-hint").type(title);
        }
        if (options) {
          const jsonOptions = JSON.parse(options);
          if (jsonOptions.hideTitle) {
            cy.get('#field-options-hideTitle').check().should('be.checked');
          }
          if (jsonOptions.columnTitles) {
            jsonOptions.columnTitles.forEach(columnTitle => {
              cy.get("#field-table-title").type(columnTitle);
              cy.findByRole("button", {name: "Add"}).click();
            })
          }
          if (jsonOptions.page && jsonOptions.page.customText) {
            cy.get("#table-title").type(jsonOptions.page.customText);
          }
          if (jsonOptions.page && jsonOptions.page.samePageTableItemName) {
            cy.get("#table-item-name").type(jsonOptions.page.samePageTableItemName);
          }
        }
      }
      cy.findByRole("button", {name: "Save"}).click({force: true});
    });
  });

});

When('change value in the final page and save continue', (table) => {
  const listItems = table.hashes();
  listItems.forEach(({question}) => {
    cy.contains('dt.govuk-summary-list__key', question)
      .parent()
      .within(() => {
        cy.get('dd.govuk-summary-list__actions a').click();
      });
  });
});

When('I will verify row content in the multi input field table', (table) => {
  const listItems = table.hashes();
  cy.get('.govuk-table tbody tr').each(($row) => {
    const rowData = []
    cy.wrap($row).find('td.govuk-table__cell').each(($cell, index, $cells) => {
      if (index === $cells.length - 1) {
        cy.wrap($cell).find('a').then(($link) => {
          expect($link.text().trim()).to.contains("Remove")
        })
      } else {
        rowData.push($cell.text().trim())
      }
    }).then(() => {
      listItems.forEach(({data}) => {
        expect(rowData).to.include(data);
      });
    })
  })
});

When('I am creating the child components in MultiInputField on page {string}', (page, table) => {
  const listItems = table.hashes();
  listItems.forEach(({name, type, title, options, hint, schema}) => {
    cy.get(`div#\\${convertToSlug(page)}`)
      .should('exist')
      .within(() => {
        cy.get('div.component-item').click();
      });
    cy.findByTestId("flyout-0").should('exist').and('be.visible').within(() => {
      cy.get('#select-field-types').select(type)
    });
    if (type === "TextField") {
      cy.findByTestId("flyout-1").should('exist').and('be.visible').within(() => {
        cy.get("#child-component-field-title").type(title);
        if (hint) {
          cy.get("#child-component-field-hint").type(hint);
        }
        cy.findByRole("button", {name: "Add"}).click();
      });
    }

    if (type === "MultilineTextField") {
      cy.findByTestId("flyout-1").should('exist').and('be.visible').within(() => {
        cy.get("#child-component-field-title").type(title);
        if (hint) {
          cy.get("#child-component-field-hint").type(hint);
        }
        cy.findByRole("button", {name: "Add"}).click();
      });
    }
    if (type === "RadiosField") {
      cy.findByTestId("flyout-1").should('exist').and('be.visible').within(() => {
        cy.get("#child-component-field-title").type(title);
        if (hint) {
          cy.get("#child-component-field-hint").type(hint);
        }
        cy.findByRole("button", {name: "Add"}).click();
      });
    }
    if (type === "YesNoField") {
      cy.findByTestId("flyout-1").should('exist').and('be.visible').within(() => {
        cy.get("#child-component-field-title").type(title);
        if (hint) {
          cy.get("#child-component-field-hint").type(hint);
        }
        cy.findByRole("button", {name: "Add"}).click();
      });
    }
    if (type === "DatePartsField") {
      cy.findByTestId("flyout-1").should('exist').and('be.visible').within(() => {
        cy.get("#child-component-field-title").type(title);
        if (hint) {
          cy.get("#child-component-field-hint").type(hint);
        }
        cy.findByRole("button", {name: "Add"}).click();
      });
    }

  });
  cy.findByRole("button", {name: "Save"}).click();
});

When('I am updating the child components in MultiInputField on page {string}', (page) => {
  cy.get(`div#\\${convertToSlug(page)}`)
    .should('exist')
    .within(() => {
      cy.get('div.component-item').click();
    });
});

When('I am adding data into following components and save and continue {string}', (skipSave, table) => {
  const listItems = table.hashes();
  listItems.forEach(({component, data, type}) => {
    if (type === "TextField" || type === "MultilineTextField") {
      cy.contains('label', component) // Find the label with the text "First name"
        .invoke('attr', 'for')           // Get the 'for' attribute value (e.g., "KXwFjM")
        .then((id) => {
          // Use the 'for' attribute value to locate the input field
          cy.get(`#${id}`).type(data);
        });
    }
    if (type === "YesNoField") {
      cy.contains(component) // Wait up to 10 seconds for the component
        .closest('.govuk-form-group').should('be.visible')
        .find('input[type="radio"]')
        .filter(`[value="${data === 'Yes' ? 'true' : 'false'}"]`)
        .check({force: true})
        .should('be.checked');
    }
    if (type === "YesNoFieldMulti" || type === "RadiosFieldMulti") {
      cy.contains(component) // Wait up to 10 seconds for the component
        .contains('label', data) // Find the label containing the given text (e.g., 'Yes' or 'No')
        .invoke('attr', 'for') // Get the 'for' attribute value, which corresponds to the radio button's id
        .then((id) => {
          cy.get(`#${id}`).check({force: true}); // Check the radio button using the id
        }).should('be.checked');
    }
    if (type === "DatePartsField") {
      const date = data.split('-');
      cy.contains('label', component)
        .find('.govuk-date-input')
        .within(() => {
          cy.get('input[id$="__day"]').clear().type(date[2]);
          cy.get('input[id$="__month"]').clear().type(date[1]);
          cy.get('input[id$="__year"]').clear().type(date[0]);
        });
    }
  });
  if (skipSave === "True") {
    cy.findByRole("button", {name: "Save and continue"}).click();
  } else {
    cy.findByRole("button", {name: "Save and add another"}).click();
  }
});

When('verify last page details {string}', (lastPageName, table) => {
  const listItems = table.hashes();
  cy.get('h1').should('contain.text', lastPageName);
  listItems.forEach(({question, answer}) => {
    cy.contains('dt.govuk-summary-list__key', question)
      .parent()
      .within(() => {
        cy.get('dd.govuk-summary-list__value')
          .invoke('text')
          .then((value) => {
            expect(value.trim()).to.equal(answer);
          });
        cy.get('dd.govuk-summary-list__actions a')
          .should('exist')
          .and('contain.text', 'Change')
          .and('have.attr', 'href')
          .and('not.be.empty');
      });
  });
});

When('I am previewing the page {string}', (page) => {
  if (Cypress.env("FS_BASIC_AUTH_USERNAME") && Cypress.env("FS_BASIC_AUTH_PASSWORD")) {
    cy.url().then(url => {
      cy.saveAndSetCookies(url);
      cy.get(`div#\\${convertToSlug(page)}`)
        .should('exist')
        .within(() => {
          cy.get('a[title="Preview page"]').click();
        });
      cy.getCookies().should('have.length.greaterThan', 0);  // Ensure at least one cookie is present
      cy.getCookie('fsd_user_token').should('exist');  // Assert that fsd_user_token exists
      cy.getCookie('fsd_user_token').should('have.property', 'value').and('not.be.empty');  // Ensures the cookie has a value
    });
  } else {
    cy.get(`div#\\${convertToSlug(page)}`)
      .should('exist')
      .within(() => {
        cy.get('a[title="Preview page"]').click();
      });
  }
});

When('I am complete update the components', () => {
  cy.findByTestId("flyout-0").should('exist').and('be.visible').within(() => {
    cy.findByRole("button", {name: "Save"}).click();
  })
});

When('I click on save and continue', () => {
  cy.findByRole("button", {name: "Save and continue"}).click();
});

When('I am creating the condition {string} mapping field is {string} and operator {string} check value {string}', (conditionName, fieldName, operator, value) => {
  cy.findByRole("button", {name: "Conditions"}).click();
  cy.findByTestId("flyout-0").should('exist').and('be.visible').within(() => {
    cy.findByRole("link", {name: "Add condition"}).click();
  })
  cy.findByTestId("flyout-1").should('exist').and('be.visible').within(() => {
    cy.get('#cond-name').type(conditionName);
    cy.get('#cond-field').select(fieldName);
    cy.get('#cond-operator').select(operator);
    cy.get('#cond-value').select(value);
    cy.findByRole("button", {name: "Add"}).click();
    cy.wait(100);
    cy.findByRole("link", {name: "Save"}).click();
    cy.wait(100);
  })
  cy.get('a.flyout__button-close[title="Close"]').click({force: true});
});

When('I am adding the condition into the link from {string} to {string} and condition {string}', (pageFrom, pageTo, conditionName) => {
  cy.get(`[data-testid="${convertToLinkName(pageFrom, pageTo)}"]`).should('be.visible').click({force: true});
  cy.get('#select-condition').select(conditionName);
  cy.findByRole("button", {name: "Save"}).click();
})

When('I am updating the radio field {string} with following list {string}', (component, listName, table) => {
  cy.get('table tbody tr') // Adjust the selector to match your table rows
    .contains('td', component) // Find the cell containing the target value
    .closest('tr') // Get the closest row containing that cell
    .within(() => {
      cy.get('button').contains('Edit').click(); // Click the Edit button if it exists
    });
  if (table) {
    cy.findByTestId("flyout-1").should('exist').and('be.visible').within(() => {
      cy.findByRole("button", {name: "Add a new list"}).click();
    });
    cy.findByTestId("flyout-2").should('exist').and('be.visible').within(() => {
      cy.get("#list-title").type(listName);
    });
    const listItems = table.hashes();
    listItems.forEach(({text, value}) => {
      cy.findByTestId("flyout-2").should('exist').and('be.visible').within(() => {
        cy.findByRole("link", {name: "Add list item"}).click();
      });
      cy.findByTestId("flyout-3").should('exist').and('be.visible').within(() => {
        cy.get("#title").type(text);
        cy.get("#value").type(value);
        cy.findByRole("button", {name: "Save"}).click();
      });
    });

    cy.findByTestId("flyout-2").should('exist').and('be.visible').within(() => {
      cy.findByRole("button", {name: "Save"}).click();
    });

    cy.findByTestId("flyout-1").should('exist').and('be.visible').within(() => {
      cy.findByRole("button", {name: "Update"}).click();
    });
  } else {
    cy.findByTestId("flyout-1").should('exist').and('be.visible').within(() => {
      cy.get('#field-options-list').select(listName);
      cy.findByRole("button", {name: "Update"}).click();
    })
  }
});

function convertToSlug(pageName) {
  // Convert to lowercase, replace spaces with hyphens, and add a slash at the start
  return `/${pageName.toLowerCase().replace(/ /g, '-')}`;
}

function convertToLinkName(pageFrom, pageTo) {
  // Convert to lowercase, replace spaces with hyphens, and add a slash at the start
  return `${pageFrom.toLowerCase().replace(/ /g, '-')}-${pageTo.toLowerCase().replace(/ /g, '-')}`;
}
