/// <reference types="Cypress" />
import React from "react";
import FileBrowser from "./FileBrowser";
import { Box } from "@mui/material";
//import { setupServer } from "msw/node";
import { setupWorker } from "msw";
import { restHandlers } from "requests/mocks";
import auth0mockable from "../../auth0mockable";

/*
// Start server before all tests
beforeEach(() => server.listen({ onUnhandledRequest: "error" }));

//  Close server after all tests
afterEach(() => server.close());

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers());
*/

describe("<FileBrowser />", () => {
  //server.listen({ onUnhandledRequest: "error" });
  before(() => {
    const worker = setupWorker(...restHandlers);
    worker.start({ onUnhandledRequest: "warn" });
  });
  beforeEach(() => {
    cy.stub(auth0mockable, "useAuth0").returns({
      getAccessTokenSilently: () => {
        console.log("MOCKED ACCESS TOKEN");
        return "abc";
      },
    });
    cy.mount(
      <Box sx={{ width: 300, height: 500 }}>
        <FileBrowser
          bucket="galatea"
          onClickFile={(f) => {
            alert("file selected: " + f.url);
          }}
        />
      </Box>
    );
  });

  it("renders", () => {
    // see: https://on.cypress.io/mounting-react

    cy.contains("galatea").should("be.visible");
  });
  it("Can select a file", () => {
    cy.on("window:alert", (str) => {
      expect(str).to.equal(`file selected: http://file1`);
    });
    cy.contains("file1").click();
  });

  it("Can select a directory for file upload", () => {
    //Only that folder should be highlighted
    cy.get("span:contains(folder1)").first().click();
    cy.get("span:contains(folder1)").should("have.length", 2);
    cy.get("div[cy-selected='true'] div:first")
      .should("have.text", "folder1")
      .should("not.have.text", "folder2");
  });

  it("Can upload a file to the right directory", () => {
    cy.intercept("POST", "http://signeduploadurl/", (req) => {
      expect(req.method).to.equal("POST");
      expect(req.body).to.include("dummy");
      req.reply({ status: "ok" });
    }).as("upload");

    cy.get("span:contains(folder1)").first().click();
    cy.get("[data-cy='upload-button']").trigger("mouseover");
    cy.contains("Upload file").should("be.visible");

    cy.get("[id='upload-input']").selectFile(
      {
        contents: Cypress.Buffer.from("dummy"),
        fileName: "dummy.txt",
      },
      { force: true }
    );
    cy.wait("@upload");
  });

  it("Can create a new folder", () => {
    cy.intercept(
      "PUT",
      "/bucket/galatea/folder?folderName=folder1/TEST",
      (req) => {
        console.log(req);
        expect(req.method).to.equal("PUT");
        expect(req.headers["content-length"]).to.equal("0");
        req.reply({ status: "ok" });
      }
    ).as("req");
    cy.get("span:contains(folder1)").first().click();
    cy.get("[data-cy='new-folder-button']").trigger("mouseover");
    cy.contains("Create new folder").should("be.visible");
    cy.get("[data-cy='new-folder-button']").click();
    cy.get("[data-cy='new-folder-text']").type("TEST");
    cy.contains("Create").click();
    cy.wait("@req");
  });

  it("Can expand and collapse a directory", () => {
    cy.get("span:contains(folder1)").first().click();
    cy.get("span:contains(folder1)").should("have.length", 2);
    cy.get("[data-cy='collapse']").eq(1).click();
    cy.get("span:contains(folder1)").should("have.length", 1);
  });

  it("Can select files and folders and delete them", () => {
    cy.intercept("DELETE", "/bucket/galatea/folder?folderName=*", (req) => {
      expect(req.method).to.equal("DELETE");
      req.reply({ status: "ok" });
    }).as("req");
    cy.get("input[type='checkbox']").first().click();
    cy.get("input[type='checkbox']").eq(3).click();
    cy.get("[data-cy='delete-button']").trigger("mouseover");
    cy.contains("Delete selected").should("be.visible");
    cy.get("[data-cy='delete-button']").click();
    cy.get("[data-cy='confirm-delete-button']").click();
    cy.wait("@req").wait("@req");
  });
});
