export {};

const onboardingSetup={targetExamPeriod:"April 2027",targetExamDate:"",dailyTargetMinutes:60,studyDays:[1,2,3,4,5,6],restDays:[0],confidence:{structural:"okay",mste:"okay",hge:"okay"},reminderEnabled:true,reminderTime:"19:00",firstMessageSeen:true,completed:true,onboardingVersion:2};
function seed(){cy.window().then(w=>w.localStorage.setItem("kih:onboarding:v2",JSON.stringify(onboardingSetup)))}
describe("Kean I Help? launch smoke",()=>{
  beforeEach(()=>{cy.visit("/");seed();cy.reload()});
  it("renders the four primary study destinations",()=>{
    ["Home","Review","Practice","Progress"].forEach(label=>cy.get("nav").contains(label).should("be.visible"));
  });
  it("provides a keyboard skip link and labelled main content",()=>{
    cy.get('a[href="#main-content"]').focus().should("be.visible");
    cy.get("#main-content").should("exist");
  });
  it("opens Review, Practice, Progress, and Settings",()=>{
    cy.visit("/review");cy.contains(/REVIEW/i).should("exist");
    cy.visit("/practice");cy.contains(/PRACTICE/i).should("exist");
    cy.visit("/progress");cy.contains(/PROGRESS/i).should("exist");
    cy.visit("/settings");cy.contains(/SETTINGS/i).should("exist");
  });
});
