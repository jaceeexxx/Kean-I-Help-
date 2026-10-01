export {};

const exam={id:"qa-exam",libraryId:"qa",title:"QA Exam",durationMinutes:10,createdAt:"2026-10-01T00:00:00.000Z",questions:[{id:"q1",number:1,prompt:"Which quantity is weight per unit volume?",choices:[{key:"A",text:"Density"},{key:"B",text:"Specific weight"},{key:"C",text:"Specific gravity"},{key:"D",text:"Viscosity"}],correctKey:"B",confidence:100,needsReview:false,areaKey:"hge",topicSlug:"fluid-properties"}]};
function seedExam(){cy.window().then(w=>w.localStorage.setItem("kih:exams:v1",JSON.stringify({"qa-exam":exam})))}
describe("practice and simulation resilience contract",()=>{
  it("keeps Simulation free from navigation/Jace and restores autosaved answers",()=>{
    cy.visit("/practice");seedExam();
    cy.visit("/practice/qa-exam/run?mode=simulation&standard=custom");
    cy.contains("SIMULATION").should("be.visible");
    cy.contains("Ask Jace").should("not.exist");
    cy.get("nav").should("not.exist");
    cy.contains("Specific weight").closest("button").click();
    cy.wait(50);
    cy.window().then(w=>{const raw=w.localStorage.getItem("kih:attempts:v1");expect(raw).to.be.a("string");const attempts=JSON.parse(raw||"{}");expect(attempts["qa-exam"].answers.q1).to.eq("B");expect(attempts["qa-exam"].expiresAt).to.be.a("string")});
    cy.reload();
    cy.contains("Specific weight").closest("button").should("have.attr","class").and("match",/chosen/);
  });
  it("auto-submits an expired restored simulation",()=>{
    cy.visit("/practice");
    cy.window().then(w=>{
      w.localStorage.setItem("kih:exams:v1",JSON.stringify({"qa-exam":exam}));
      const past=new Date(Date.now()-60_000).toISOString();
      const attempt={id:"expired-attempt",examId:"qa-exam",mode:"simulation",startedAt:new Date(Date.now()-11*60_000).toISOString(),expiresAt:past,answers:{q1:"B"},flagged:[],currentIndex:0,durationMinutes:10,questionTimesSec:{q1:20},lastQuestionEnteredAt:past,simulationStandard:"custom"};
      w.localStorage.setItem("kih:attempts:v1",JSON.stringify({"qa-exam":attempt}));
    });
    cy.visit("/practice/qa-exam/run?mode=simulation&standard=custom");
    cy.url().should("include","/practice/qa-exam/results");
    cy.window().then(w=>{const attempts=JSON.parse(w.localStorage.getItem("kih:attempts:v1")||"{}");expect(attempts["qa-exam"].autoSubmitted).to.eq(true)});
  });
});
