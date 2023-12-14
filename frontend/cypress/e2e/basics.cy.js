describe("Basic functionality", () => {
  beforeEach(() => {
    cy.visit("/");
  });
  /*

  it("Can hide and show file browser, click login button", () => {
    //Filebrowser is open on page load
    cy.get("[data-cy=drawer-close]").click();
    //Click to close filebrowser
    cy.get("[data-cy=upload-button]").should("not.be.visible");
    //Click to open filebrowser
    cy.get("[data-cy=drawer-open]").click();
    cy.get("[data-cy=upload-button]").should("be.visible");
    //Click profile button
    cy.get("[data-cy=profile-button]").click();
    cy.contains("Log out").should.exist;
  });

  it("Should successfully open app and upload a file", () => {
    cy.visit("/");
    //Click upload button

    //Select test .pt3
    cy.fixture("2_frames.pt3", { encoding: null }).as("pt3");
    cy.get("[id=upload-input]").selectFile("@pt3", { force: true });

    //Should see .pt3 appear in list of files
    cy.contains("2_frames", { timeout: 20000 }).click();

    //Click it and it should begin converting
    cy.contains("Loading").should("be.visible");

    //Image frame should be loaded
    cy.get("[data-cy=frame-original]", { timeout: 60000 })
      .should("be.visible")
      .and(($img) => {
        expect($img[0].naturalWidth).to.be.greaterThan(0);
      });

    //Combined image should be loaded
    cy.get("[data-cy=combined-original]")
      .should("be.visible")
      .and(($img) => {
        expect($img[0].naturalWidth).to.be.greaterThan(0);
      });
  });

 
  it("Can select parameters and apply correction", () => {
    //Click .pt3 to load it
    cy.contains("2_frames").click();
    cy.get("[data-cy=loading-box]").should("be.visible");
    cy.get("[data-cy=loading-box]", { timeout: 20000 }).should("not.exist");
    //Can see only one channel
    cy.get("[data-cy=channel-select]")
      .should("contain", "1")
      .should("not.contain", "2");
    //Change reference frame to 2
    cy.get("[data-cy=ref-frame-field] input").clear().type("2");
    //Should not be able to select reference frame outside of range

    //Change local correction algorithm to morphic
    cy.get("[data-cy=local-correction-select]").click();
    cy.contains("Morphic").click();
    //Sigma and radius options should appear, change radius
    cy.get("[id=Morphic_radius]").clear().type(10);
    //Change global correction algorithm to phase
    cy.get("[data-cy=global-correction-select]").click();
    cy.contains("Phase").click();
    //Apply correction and wait
    cy.get("[data-cy=apply-correction-button]").click();
    //Results should be visible on the left and selected
    cy.get("[data-cy=result-item]:last span", { timeout: 20000 })
      .should("contain", "morphic")
      .and("have.css", "font-weight", "700");
  });

  it("Can select previously generated result and download as pt3", () => {
    //Click .pt3 to load it
    cy.contains("2_frames").click();
    cy.get("[data-cy=loading-box]").should("be.visible");
    cy.get("[data-cy=loading-box]", { timeout: 20000 }).should("not.exist");
    //Click on result to view result
    cy.contains("Local: morphic").click();
    //Parameters should be the same as result
    //Download as pt3
    cy.get("[data-cy=pt3-download]").click();
    cy.contains("Converting to PT3").should("exist");
    cy.contains("Converting to PT3", { timeout: 20000 }).should("not.exist");
    const downloadsFolder = Cypress.config("downloadsFolder");
    cy.wait(2000);
    cy.task("downloads", downloadsFolder).then((fileList) =>
      expect(fileList[0]).to.match(/2_frames/)
    );
  });

   */

  it("Can interact with the frames", () => {
    //Load pt3 and result

    cy.contains("2_frames").click();
    cy.get("[data-cy=loading-box]").should("be.visible");
    cy.get("[data-cy=loading-box]", { timeout: 20000 }).should("not.exist");
    cy.contains("Local: morphic").click();

    //Corrected frame should be loaded
    cy.get("[data-cy=frame-corrected]")
      .should("be.visible")
      .and(($img) => {
        expect($img[0].naturalWidth).to.be.greaterThan(0);
      });

    //Reference frame should be loaded
    cy.get("[data-cy=frame-reference]")
      .should("be.visible")
      .and(($img) => {
        expect($img[0].naturalWidth).to.be.greaterThan(0);
      });
    //Change repitition

    cy.get("[data-cy=repetition-slider] [data-index=1]").click();

    //Turn off layers
    cy.get("[data-cy=frame-original]").should("exist");
    cy.get("[data-cy=checkbox-original]").click();
    cy.get("[data-cy=frame-original]").should("not.exist");
    cy.get("[data-cy=checkbox-original]").click();
    cy.get("[data-cy=frame-original]").should("exist");

    cy.get("[data-cy=frame-corrected]").should("exist");
    cy.get("[data-cy=checkbox-corrected]").click();
    cy.get("[data-cy=frame-corrected]").should("not.exist");
    cy.get("[data-cy=checkbox-corrected]").click();
    cy.get("[data-cy=frame-corrected]").should("exist");

    cy.get("[data-cy=frame-reference]").should("exist");
    cy.get("[data-cy=checkbox-reference]").click({ force: true });
    cy.get("[data-cy=frame-reference]").should("not.exist");
    cy.get("[data-cy=checkbox-reference]").click({ force: true });
    cy.get("[data-cy=frame-reference]").should("exist");
    //Make repitition not used
    cy.get("[data-cy=checkbox-repetition]").click();
    //Source of combined flim image should be changed
    cy.get("[data-cy=combined-original]").then(($img) => {
      expect($img.attr(""));
    });
  });

  it("Can interact with combined flim image", () => {
    //Load pt3
    //Original combined image should be visible.
    //Corrected combined image should be be selectible
    //Load result
    //Toggle corrected combined image
    //Click on combined image, should show loading then populate chart
    //Toggle original, FLIM chart should update
  });

  it("Can view metrics for result", () => {
    //Load pt3 and result
    //Metrics should be visible
    //Change metric type
    //Chart should change
  });

  it("Can delete result", () => {
    //Load pt3 and result
    //Delete pt3
    //Result should not be visible on left. No option to toggle corrected combined or display result frame.
  });
});
