// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('login', ({ id = 'aidenq', pw = 'Rightpass1!' } = {}) => {
  cy.clearLocalStorage();
  cy.visit('/');
  cy.get('form#login-in').within(() => {
    cy.get('input[placeholder="ID"]').type(id);
    cy.get('input[placeholder="Password"]').type(pw);
    cy.get('button[type="submit"]').click();
  });
  cy.url().should('include', '/main');
});
