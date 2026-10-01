export {};

const setup={targetExamPeriod:"April 2027",targetExamDate:"",dailyTargetMinutes:60,studyDays:[1,2,3,4,5,6],restDays:[0],confidence:{structural:"okay",mste:"okay",hge:"okay"},reminderEnabled:false,reminderTime:"19:00",firstMessageSeen:true,completed:true,onboardingVersion:2};

describe("accessibility preferences",()=>{
  beforeEach(()=>{cy.visit("/");cy.window().then(w=>w.localStorage.setItem("kih:onboarding:v2",JSON.stringify(setup)));cy.reload()});
  it("keeps keyboard navigation anchored to main content",()=>{cy.get('a[href="#main-content"]').focus().should("be.visible");cy.get("#main-content").should("have.attr","tabindex","-1")});
  it("applies large text, contrast, underlined-link and reduced-motion preferences",()=>{
    cy.window().then(w=>w.localStorage.setItem("kih:ui-preferences:v2",JSON.stringify({theme:"dark",reducedMotion:true,textScale:"large",highContrast:true,underlineLinks:true})));
    cy.reload();
    cy.get("html").should("have.attr","data-theme","dark").and("have.attr","data-reduce-motion","true").and("have.attr","data-text-scale","large").and("have.attr","data-high-contrast","true").and("have.attr","data-underline-links","true");
  });
});
