import {AUTH0_PASSWORD, AUTH0_USERNAME, BACKEND_URL, FRONTEND_URL} from "../../src/utils/constants";
import {CreateSnippet} from "../../src/utils/snippet";
import {paginationParams} from "../../src/utils/pagination";

describe('Home', () => {
  beforeEach(() => {
    cy.loginToAuth0(
        Cypress.env('AUTH0_USERNAME'),
        Cypress.env('AUTH0_PASSWORD')
    )
  })
  before(() => {
    process.env.FRONTEND_URL = Cypress.env("FRONTEND_URL");
    process.env.BACKEND_URL = Cypress.env("BACKEND_URL");
  })
  it('Renders home', () => {
    cy.visit('https://snippet-searcher.brazilsouth.cloudapp.azure.com/')
    /* ==== Generated with Cypress Studio ==== */
    cy.get('.MuiTypography-h6').should('have.text', 'Printscript');
    cy.get('.MuiBox-root > .MuiInputBase-root > .MuiInputBase-input').should('be.visible');
    cy.get('.css-9jay18 > .MuiButton-root').should('be.visible');
    cy.get('.css-jie5ja').click();
    /* ==== End Cypress Studio ==== */
  })

  // You need to have at least 1 snippet in your DB for this test to pass
  it('Renders the first snippets', () => {
    cy.visit('https://snippet-searcher.brazilsouth.cloudapp.azure.com/')
    const first10Snippets = cy.get('[data-testid="snippet-row"]')

    first10Snippets.should('have.length.greaterThan', 0)

    first10Snippets.should('have.length.lessThan', 11)
  })

  it('Can creat snippet find snippets by name', () => {
    cy.visit('https://snippet-searcher.brazilsouth.cloudapp.azure.com/');
    const snippetData: CreateSnippet = {
      name: "Test name",
      content: "println(1);",
      language: "printscript",
      extension: "psc"
    }

    const reqBody = {
      title: snippetData.name,
      language: snippetData.language,
      extension: snippetData.extension,
      code: snippetData.content
    }

    cy.intercept('GET',`https://snippet-searcher.brazilsouth.cloudapp.azure.com/api/snippet/snippet/get/all?relation=ALL&${paginationParams(0, 10)}&prefix=`,
      (req) => {
        req.reply((res) => {
          expect(res.statusCode).to.eq(200);
        });
      }).as('getSnippets');

    cy.request({
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authAccessToken')}`
      },
      url: 'http://localhost:8080/snippet/save',
      body: reqBody,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(200);

      expect(response.body.title).to.eq(snippetData.name)
      expect(response.body.code).to.eq(snippetData.content)
      expect(response.body.language).to.eq(snippetData.language)
      expect(response.body).to.haveOwnProperty("id")

      cy.get('.MuiBox-root > .MuiInputBase-root > .MuiInputBase-input').clear();
      cy.get('.MuiBox-root > .MuiInputBase-root > .MuiInputBase-input').type(snippetData.name + "{enter}");

      cy.wait("@getSnippets")
      cy.contains(snippetData.name).should('exist');
    })
  })
})
