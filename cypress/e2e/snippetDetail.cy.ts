import {AUTH0_PASSWORD, AUTH0_USERNAME, BACKEND_URL} from "../../src/utils/constants";
import {FakeSnippetStore} from "../../src/utils/mock/fakeSnippetStore";
import {paginationParams} from "../../src/utils/pagination";

describe('Add snippet tests', () => {
  const snippet = {
    id: "",
    title: "Some snippet name",
    code: "println(1);",
    language: "printscript",
    extension: "psc",
    lintStatus: "COMPLIANT",
    author: "sonpipe"
  }
  beforeEach(() => {
    cy.loginToAuth0(
      Cypress.env("AUTH0_USERNAME2"),
      Cypress.env("AUTH0_PASSWORD2")
    )
    //clear cookies
    cy.clearCookies()
    cy.loginToAuth0(
      Cypress.env("AUTH0_USERNAME"),
      Cypress.env("AUTH0_PASSWORD")
    )
    cy.visit("http://localhost:5173")

    cy.intercept('GET', new RegExp(`https://snippet-searcher.brazilsouth.cloudapp.azure.com/api/snippet/snippet/details/\\?snippetId=.*`), (req) => {
      req.reply((res) => {
        snippet.id = res.body.id; // Capture the generated UUID from the response
      });
    }).as("getSnippetById")
    cy.intercept('GET', `/snippet/get/all?relation=ALL&${paginationParams(0, 10)}&prefix=`).as("getSnippets")

    cy.visit("https://snippet-searcher.brazilsouth.cloudapp.azure.com/")

    cy.wait("@getSnippets")
    cy.get('.MuiTableBody-root > :nth-child(1) > :nth-child(1)').click();
  })

  it('Can share a snippet ', () => {
    cy.get('[aria-label="Share"]').click();
    cy.get('#\\:rj\\:').click();
    cy.contains('pedro').click();
    cy.get('.css-1yuhvjn > .MuiBox-root > .MuiButton-contained').click();
    cy.wait(2000)
  })

  // it('Can run snippets', function() {
  //   cy.get('[data-testid="PlayArrowIcon"]').click();
  //   cy.get('.css-1hpabnv > .MuiBox-root > div > .npm__react-simple-code-editor__textarea').should("have.length.greaterThan",0);
  // });

  it('Can format snippets', function() {
    cy.get('[data-testid="ReadMoreIcon"] > path').click();
  });

  it('Can save snippets', function() {
    cy.get('.css-10egq61 > .MuiBox-root > div > .npm__react-simple-code-editor__textarea').click();
    cy.get('.css-10egq61 > .MuiBox-root > div > .npm__react-simple-code-editor__textarea').type("println(1);");
    cy.get('[data-testid="SaveIcon"] > path').click();
  });

  it('Can delete snippets', function() {
    cy.get('[data-testid="DeleteIcon"] > path').click();
  });
})
