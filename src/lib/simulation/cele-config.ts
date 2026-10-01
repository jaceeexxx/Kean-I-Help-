import type { PRCBlockKey } from "@/lib/exam-types";
import type { AreaKey } from "@/lib/curriculum";

export type CELEBlock = {
  key: PRCBlockKey;
  areaKey: AreaKey;
  shortLabel: string;
  subject: string;
  weight: number;
  durationMinutes: number;
  officialStart: string;
  officialEnd: string;
  day: 1 | 2;
  knownQuestionCount?: number;
};

export const CELE_SIMULATION_STANDARD = {
  id: "prc-2026" as const,
  label: "PRC CELE format",
  guidelineVersion: "PRC Board Resolution No. 01 (s. 2026)",
  effectiveFrom: "March 2026",
  sourceUrl:
    "https://www.prc.gov.ph/article/adjustments-order-subjects-be-administered-starting-march-2026-cele",
  programUrl:
    "https://www.prc.gov.ph/sites/default/files/RevisedExamProgramMarch2026CivilEngg.pdf",
  note:
    "Current simulation baseline. Update this configuration if PRC publishes a superseding CELE program.",
  blocks: [
    {
      key: "structural",
      areaKey: "structural",
      shortLabel: "Structural Analysis & Design",
      subject: "Principles of Structural Analysis and Design",
      weight: 35,
      durationMinutes: 360,
      officialStart: "8:00 AM",
      officialEnd: "2:00 PM",
      day: 1,
      knownQuestionCount: 75,
    },
    {
      key: "mste",
      areaKey: "mste",
      shortLabel: "Math / Surveying / Transportation / Construction",
      subject:
        "Applied Mathematics, Surveying, Principles of Transportation and Highway Engineering, Construction Management and Methods",
      weight: 35,
      durationMinutes: 300,
      officialStart: "8:00 AM",
      officialEnd: "1:00 PM",
      day: 2,
    },
    {
      key: "hge",
      areaKey: "hge",
      shortLabel: "Hydraulics & Geotechnical",
      subject: "Hydraulics and Principles of Geotechnical Engineering",
      weight: 30,
      durationMinutes: 240,
      officialStart: "2:00 PM",
      officialEnd: "6:00 PM",
      day: 2,
    },
  ] satisfies CELEBlock[],
};

export function getCELEBlock(key: string | null | undefined) {
  return CELE_SIMULATION_STANDARD.blocks.find((block) => block.key === key) ?? null;
}
