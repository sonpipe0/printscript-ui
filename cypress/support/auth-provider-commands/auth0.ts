

export function loginViaAuth0Ui(username: string, password: string) {
  // App landing page redirects to Auth0.
  cy.visit('https://snippet-searcher.brazilsouth.cloudapp.azure.com/')

  // Login on Auth0.
  cy.origin(
      Cypress.env('VITE_AUTH0_DOMAIN'),
      { args: { username, password } },
      ({ username, password }) => {
        cy.get('input#username').type(username)
        cy.get('input#password').type(password, { log: false })
        cy.contains('button[value=default]', 'Continue').click({ force: true })
      }
  )

  // Ensure Auth0 has redirected us back to the RWA.
  cy.url().should('equal', 'https://snippet-searcher.brazilsouth.cloudapp.azure.com/')
}




