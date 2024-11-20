
describe('Protected routes test', () => {
  it('should redirect to login when accessing a protected route unauthenticated', () => {
    // Visit the protected route
    cy.visit('https://snippet-searcher.brazilsouth.cloudapp.azure.com/rules');
    cy.origin(Cypress.env('VITE_AUTH0_DOMAIN'), () => {
      cy.url().should('include', '/login');
    });
  });

  it('should display login content', () => {
    // Visit the login page
    cy.visit("https://snippet-searcher.brazilsouth.cloudapp.azure.com/");
    cy.wait(2000)

    cy.origin(Cypress.env('VITE_AUTH0_DOMAIN'), () => {
      cy.contains('Log in').should('exist');
      cy.contains('Password').should('exist');
    });
  });

  it('should not redirect to login when the user is already authenticated', () => {
    cy.loginToAuth0(
      Cypress.env("AUTH0_USERNAME"),
      Cypress.env("AUTH0_PASSWORD")
    )

    cy.visit("https://snippet-searcher.brazilsouth.cloudapp.azure.com/");

    cy.wait(1000)

    // Check if the URL is redirected to the login page
    cy.url().should('not.include', '/login');
  });

})
