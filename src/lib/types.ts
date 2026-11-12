export type ScienceId = "biology" | "chemistry" | "physics";
export type Tier = "foundation" | "higher" | "both";

export interface Question {
  id: string;
  type: "mcq" | "numeric" | "short" | "extended";
  tier: Tier;
  difficulty: 1 | 2 | 3;
  marks: number;
  question: string;
  options?: string[];
  answer?: number;
  numericAnswer?: number;
  tolerance?: number;
  unit?: string;
  acceptedAnswers?: string[];
  markScheme: string[];
  explanation: string;
  // added at build time
  source?: { science: ScienceId; topicId: string; slug: string; title: string; higherOnly: boolean; separateOnly: boolean };
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface Diagram {
  title: string;
  caption: string;
  svg: string;
}

export interface Equation {
  name: string;
  formula: string;
  symbols?: string;
  units?: string;
  recall: boolean;
}

export interface Notes {
  definition: string;
  explanation: string[];
  keyFacts: string[];
  keyTerms: { term: string; definition: string }[];
  equations: Equation[];
  workedExamples: { title?: string; question: string; steps: string[]; answer: string }[];
  diagrams: Diagram[];
  misconceptions: { wrong: string; right: string }[];
  realWorld: string[];
  practicals: string[];
  higherTier: string[];
  separateOnlyContent: string[];
  examTips: string[];
  summary: string[];
}

export interface Subtopic {
  id: string;
  science: ScienceId;
  topicId: string;
  slug: string;
  specRef: string;
  title: string;
  separateOnly: boolean;
  higherOnly: boolean;
  notes: Notes;
  flashcards: Flashcard[];
  questions: Question[];
}

export interface SpecSubtopic {
  slug: string;
  specRef: string;
  title: string;
  separateOnly: boolean;
  higherOnly: boolean;
  available?: boolean;
  questionCount?: number;
}

export interface SpecTopic {
  id: string;
  code: string;
  specRef: string;
  name: string;
  subtopics: SpecSubtopic[];
}

export interface SpecPractical {
  id: string;
  number: number;
  title: string;
  combined: boolean;
  topic: string;
  subtopic: string;
}

export interface Spec {
  science: ScienceId;
  name: string;
  specCodes: { separate: string; combined: string };
  topics: SpecTopic[];
  practicals: SpecPractical[];
}

export interface Practical {
  id: string;
  science: ScienceId;
  number: number;
  title: string;
  combined: boolean;
  topicId: string;
  subtopic: string;
  aim: string;
  background: string[];
  hypothesis: string;
  variables: { independent: string; dependent: string; control: string[] };
  equipment: string[];
  method: string[];
  safety: { hazard: string; risk: string; precaution: string }[];
  results: { headers: string[]; rows: string[][]; notes: string };
  analysis: string[];
  errors: { error: string; improvement: string }[];
  diagram: Diagram;
  examTips: string[];
  questions: Question[];
}
