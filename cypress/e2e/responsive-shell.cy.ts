export {};

const onboardingSetup={targetExamPeriod:"April 2027",targetExamDate:"",dailyTargetMinutes:60,studyDays:[1,2,3,4,5,6],restDays:[0],confidence:{structural:"okay",mste:"okay",hge:"okay"},reminderEnabled:true,reminderTime:"19:00",firstMessageSeen:true,completed:true,onboardingVersion:2};
function seed(){cy.window().then(w=>w.localStorage.setItem("kih:onboarding:v2",JSON.stringify(onboardingSetup)))}

describe("responsive app shell",()=>{
  const compact:[[number,number],[number,number]]=[[375,667],[390,844]];
  compact.forEach(([width,height])=>{
    it(`keeps primary mobile navigation usable at ${width}x${height}`,()=>{
      cy.viewport(width,height);cy.visit("/");seed();cy.reload();
      cy.get('nav[aria-label="Primary"]').should("be.visible").within(()=>{
        ["Home","Review","Practice","Progress","Jace"].forEach(label=>cy.contains(label).should("be.visible"));
      });
      cy.get('aside[aria-label="Primary"]').should("not.be.visible");
    });
  });

  it("uses the compact/tablet shell in iPad portrait",()=>{
    cy.viewport(768,1024);cy.visit("/");seed();cy.reload();
    cy.get('nav[aria-label="Primary"]').should("be.visible");
    cy.get('aside[aria-label="Primary"]').should("not.be.visible");
  });

  [[1024,768],[1440,900]].forEach(([width,height])=>{
    it(`uses persistent desktop navigation at ${width}x${height}`,()=>{
      cy.viewport(width,height);cy.visit("/");seed();cy.reload();
      cy.get('aside[aria-label="Primary"]').should("be.visible");
      cy.get('nav[aria-label="Primary"]').should("not.be.visible");
      cy.contains("Ask Jace").should("be.visible");
    });
  });
});
