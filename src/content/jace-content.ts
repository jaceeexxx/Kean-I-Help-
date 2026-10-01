/**
 * Phase 7 personality content.
 *
 * Preview copy lives here so the product works end-to-end. Before Kean receives
 * the final gift, Jace can replace or expand these lines with his own words
 * without touching the reaction engine or UI components.
 */

export const firstMessageFromJace =
  "Hi, my love. I made this so reviewing doesn’t have to feel like something you’re carrying alone. I’ll be around in the little ways I can be — now go make Future Engr. Kean happen. 💛";

export const dailyGreetings = [
  "Padayon, My love.",
  "Kaya mo ’to, My love.",
  "One more today, My love.",
  "Konti na lang, My love.",
  "Proud of you, My love.",
  "Bawi tayo today, My love.",
  "Steady lang, My love.",
  "Show up gently, My love.",
] as const;

export const dailyMessages = [
  "You don’t have to know everything today. Just know a little more than yesterday.",
  "One problem at a time. I’m already proud that you showed up today. 💛",
  "Rest when you need to. The goal is to keep going, not to exhaust yourself.",
  "Future Engr. Kean sounds very nice, by the way. Just saying. 👀",
  "Don’t rush the question, my love. Read it twice, then trust what you know.",
  "A hard topic is still learnable. We can come back to it as many times as needed.",
  "Small progress still counts. Especially the kind nobody else sees.",
  "You’re allowed to have slow days. Padayon still counts when it’s slow.",
  "Study smart today, then please remember to eat and rest too 😭",
  "You’re building this one answer, one formula, one day at a time. 💙",
] as const;

export const countdownMessages: Record<number, string> = {
  30: "30 days, My love. We don’t need a dramatic reinvention — just steady days from here. 💛",
  14: "Two weeks. Protect your energy, trust the work you’ve already done, and keep sharpening what still feels shaky.",
  7: "One week, My love. No panic-cramming. We review what matters, fix what repeats, and let your brain breathe too.",
  1: "Tomorrow is CELE. Tonight is for a light review, your essentials, and actual rest. I’m already proud of how far you made it. 💛",
  0: "CELE Day 1, My love. Read carefully, breathe between hard items, and take the exam one question at a time. Future Engr. Kean, go do your thing. 💙",
  [-1]: "Day 2, My love. Yesterday is finished — no replaying it in your head. One more exam day, one question at a time. 💛",
  [-2]: "You finished CELE, My love. Whatever your brain wants to overanalyze can wait. Eat, rest, and be proud you made it through both days. 💛",
};

export const lessonNotes: Record<string, string> = {
  "equilibrium-basics": "Free-body diagram first, My love. Huwag agad formula hunt 😭",
  "calculus-rates": "Differentiate muna before plugging numbers. Please lang 😭",
  "fluid-properties-basics": "ρ and γ look like cousins but they are not interchangeable, My love 👀",
};

export const reactionLines = {
  lessonCorrect: ["AYANNNN 😭👏", "YESSS. That one’s yours now.", "Okayyy, gets na. Keep it moving 👏"],
  lessonMiss: ["Okay okay, kaya natin ’to.", "Noted. At least alam na natin saan aayusin. 💛", "One miss = one useful clue. Balikan natin."],
  lessonComplete: ["TAPOS NA??? Proud of youuuu.", "One topic lighter, My love. 😭👏", "Done. Tiny win secured. 💛"],
  examHigh: ["AYANNN. Serious result first, then: proud of youuuu 😭👏", "That paper looked good on you, Future Engr. 👀", "Okayyy. Keep the confidence, keep the discipline."],
  examMid: ["Good data. Now we know exactly what to sharpen next. 💛", "Solid base. Hindi pa tapos, pero gumagalaw talaga.", "Keep this score as information, not identity. Next review is clearer now."],
  examLow: ["Okay lang ’yan. At least alam na natin saan babawi 💛", "This score is a map, not a verdict. We fix the repeat misses next.", "No shame. We found the weak spots — that’s useful."],
  milestone: ["Milestone unlocked 😭👏", "LOOK AT YOU. Quiet progress still counts. 💛", "Another little receipt that the work is working."],
  planBuilt: ["Tomorrow = handled. Now please rest too 😭", "Plan made. No giant guilt schedule, promise. 💛", "Okay, bukas may direction na. Good job."],
  returnAfterRest: ["Welcome back, My love 😌", "Rest day survived. Rhythm intact. Tara.", "Back from rest — no guilt tax. Let’s go 💛"],
} as const;
