export {};

describe("PWA privacy and update contract",()=>{
  it("does not cache API/auth responses and supports private-cache clearing",()=>{
    cy.request("/sw.js").its("body")
      .should("include",'url.pathname.startsWith("/api/")')
      .and("include",'url.pathname.startsWith("/auth/")')
      .and("include","CLEAR_PRIVATE_CACHES")
      .and("include","SKIP_WAITING")
      .and("include","kih-v2-private-nav-v20");
  });
  it("uses the final branded install assets",()=>{
    cy.request("/manifest.webmanifest").its("body").then(body=>{
      const manifest=typeof body==="string"?JSON.parse(body):body;
      expect(manifest.name).to.eq("Kean I Help?");
      expect(manifest.display).to.eq("standalone");
      expect(manifest.icons.some((icon:{purpose?:string})=>icon.purpose==="maskable")).to.eq(true);
    });
  });
});
