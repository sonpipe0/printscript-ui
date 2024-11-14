import { AUTH0_PASSWORD, AUTH0_USERNAME, BACKEND_URL } from "../../src/utils/constants";

describe('Add snippet tests', () => {
  beforeEach(() => {
    cy.loginToAuth0(
      Cypress.env('AUTH0_USERNAME'),
      Cypress.env('AUTH0_PASSWORD')
    );
  });

  it('Can add snippets manually', () => {
    cy.visit("http://localhost:5173");
    cy.wait(5000);
    cy.intercept('POST', "http://localhost:8080/snippet/save", (req) => {
      req.reply((res) => {
        expect(res.body).to.include.keys ("id", "title", "code", "language", "extension", "lintStatus");
        expect(res.statusCode).to.eq(200);
      });
    }).as('postRequest');

    cy.get('.css-9jay18 > .MuiButton-root').click();
    cy.get('.MuiList-root > [tabindex="0"]').click();
    cy.get('#name').type('Some snippet name');
    cy.get('#demo-simple-select').click();
    cy.get('[data-testid="menu-option-printscript"]').click();

    cy.get('[data-testid="add-snippet-code-editor"]').click();
    cy.get('[data-testid="add-snippet-code-editor"]').type(`const snippet: string = "some snippet" ;\n println(snippet);`);
    cy.get('[data-testid="SaveIcon"]').click();

    cy.wait('@postRequest').its('response.statusCode').should('eq', 200);
  });

  it('Can add snippets via file', () => {
    cy.visit("/");
    cy.wait(5000);
    cy.intercept('POST', "http://localhost:8080/snippet/save", (req) => {
      req.reply((res) => {
        expect(res.body).to.include.keys ("id", "title", "code", "language", "extension", "lintStatus");
        expect(res.statusCode).to.eq(200);
      });
    }).as('postRequest');

    cy.get('[data-testid="upload-file-input"]').selectFile("cypress/fixtures/example_ps.psc", { force: true });

    cy.get('[data-testid="SaveIcon"]').click();

    cy.wait('@postRequest').its('response.statusCode').should('eq', 200);
  });
});