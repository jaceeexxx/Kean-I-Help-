export {};

describe("offline shell",()=>{
  it("has a dedicated offline fallback screen",()=>{cy.visit("/offline");cy.contains("OFFLINE MODE").should("be.visible");cy.contains("Open Today").should("be.visible")});
  it("does not expose API responses through the service-worker cache rules",()=>{cy.request("/sw.js").its("body").should("include",'url.pathname.startsWith("/api/")').and("include","/offline")});
});
