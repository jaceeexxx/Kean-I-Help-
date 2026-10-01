import { lessonNotes } from "@/content/jace-content";

export type LessonData = {
  slug: string;
  title: string;
  subtitle: string;
  area: "structural" | "mste" | "hge";
  topicSlug: string;
  readMinutes: number;
  outcomes: string[];
  concept: string[];
  formula: string;
  formulaNote: string;
  jace: string;
  workedExample: {
    given: string;
    find: string;
    steps: string[];
    answer: string;
  };
  question: { prompt: string; choices: string[]; answer: number };
};

export const lessons: LessonData[] = [
  {
    slug: "equilibrium-basics",
    title: "Equilibrium without the panic",
    subtitle: "Engineering Mechanics · Statics",
    area: "structural",
    topicSlug: "engineering-mechanics",
    readMinutes: 8,
    outcomes: ["Build a clean free-body diagram", "Choose the right equilibrium equation", "Solve simple support reactions without formula hunting"],
    concept: [
      "Static equilibrium means a body has zero net translation and zero net rotation.",
      "For planar rigid-body problems, isolate the body first. Put every external force and reaction on the free-body diagram before writing equations.",
      "A useful order is to take moments about a point that eliminates the most unknowns, then finish with force equilibrium.",
    ],
    formula: "ΣFx = 0   ·   ΣFy = 0   ·   ΣM = 0",
    formulaNote: "For a 2D rigid body in static equilibrium, these three independent equations are the usual starting set.",
    jace: lessonNotes["equilibrium-basics"],
    workedExample: {
      given: "A simply supported 4 m beam carries a 10 kN point load at midspan.",
      find: "Vertical reactions at supports A and B.",
      steps: [
        "Draw the beam and show upward reactions RA and RB.",
        "Take moments about A: RB(4) − 10(2) = 0.",
        "Solve RB = 5 kN.",
        "Use ΣFy = 0: RA + 5 − 10 = 0, so RA = 5 kN.",
      ],
      answer: "RA = 5 kN upward and RB = 5 kN upward.",
    },
    question: {
      prompt: "For a 2D rigid body in static equilibrium, which set is normally sufficient?",
      choices: ["ΣFx = 0 only", "ΣFy = 0 only", "ΣFx = 0, ΣFy = 0, and ΣM = 0", "Nonzero acceleration equations"],
      answer: 2,
    },
  },
  {
    slug: "calculus-rates",
    title: "Related rates, translated",
    subtitle: "Applied Mathematics · Calculus",
    area: "mste",
    topicSlug: "calculus",
    readMinutes: 9,
    outcomes: ["Translate changing quantities into a relation", "Differentiate with respect to time", "Substitute the instant only after differentiating"],
    concept: [
      "Related-rates problems connect two or more quantities that are changing with time.",
      "Write the geometric or physical relationship first while the variables are still symbolic.",
      "Differentiate the entire relationship with respect to time, then substitute the values that apply at the instant being asked about.",
    ],
    formula: "d/dt[f(x)] = f′(x) · dx/dt",
    formulaNote: "The chain rule is the reason a changing x contributes the factor dx/dt.",
    jace: lessonNotes["calculus-rates"],
    workedExample: {
      given: "A circle's radius increases at 0.5 m/s. At one instant, r = 2 m.",
      find: "How fast the area is increasing at that instant.",
      steps: [
        "Start with A = πr².",
        "Differentiate with respect to time: dA/dt = 2πr(dr/dt).",
        "Substitute r = 2 m and dr/dt = 0.5 m/s.",
        "dA/dt = 2π(2)(0.5) = 2π m²/s.",
      ],
      answer: "The area is increasing at 2π m²/s, about 6.28 m²/s.",
    },
    question: {
      prompt: "When is it usually safest to substitute instantaneous values in a related-rates problem?",
      choices: ["Before writing the relation", "Before differentiating", "After differentiating", "Never"],
      answer: 2,
    },
  },
  {
    slug: "fluid-properties-basics",
    title: "Fluid properties that keep showing up",
    subtitle: "Hydraulics · Fundamentals",
    area: "hge",
    topicSlug: "fluid-properties",
    readMinutes: 8,
    outcomes: ["Separate density from specific weight", "Use γ = ρg correctly", "Recognize specific gravity as dimensionless"],
    concept: [
      "Density, ρ, is mass per unit volume. Specific weight, γ, is weight per unit volume.",
      "Specific gravity compares a substance's density to the density of a reference fluid, commonly water for liquids.",
      "Always check the units before substituting. kg/m³ signals density, while N/m³ signals specific weight.",
    ],
    formula: "γ = ρg   ·   SG = ρ / ρwater",
    formulaNote: "Specific gravity has no units because it is a ratio of two densities with the same units.",
    jace: lessonNotes["fluid-properties-basics"],
    workedExample: {
      given: "Water has density ρ = 1000 kg/m³. Use g = 9.81 m/s².",
      find: "Specific weight of water.",
      steps: [
        "Use γ = ρg.",
        "Substitute γ = (1000)(9.81) N/m³.",
        "γ = 9810 N/m³.",
        "Convert to kN/m³ by dividing by 1000.",
      ],
      answer: "γ = 9.81 kN/m³.",
    },
    question: {
      prompt: "Which quantity has units of N/m³?",
      choices: ["Density", "Specific weight", "Specific gravity", "Kinematic viscosity"],
      answer: 1,
    },
  },
];

export const getLesson = (slug: string) => lessons.find(lesson => lesson.slug === slug);
