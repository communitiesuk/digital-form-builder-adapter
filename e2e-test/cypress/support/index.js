beforeEach(() => {
  // Intercept all network requests
  cy.intercept('*').as('allRequests');
  // Log requests and responses
  cy.on('request', (req) => {
    cy.log(`Request made: ${req.method} ${req.url}`);
  });
  // Handle all responses, including errors
  cy.on('response', (res) => {
    if (res.statusCode >= 400) {
      cy.log(`Error Response: ${res.statusCode} - ${res.statusMessage} - ${res.url}`);
      cy.log(`Error Body: ${JSON.stringify(res.body)}`);
    } else {
      cy.log(`Response received: ${res.statusCode} ${res.url}`);
    }
  });
  // Handle network errors
  Cypress.on('fail', (error) => {
    cy.log(`Network Error: ${error.message}`);
    cy.log(`Error details: ${JSON.stringify(error)}`);
    throw error;
  });
});
