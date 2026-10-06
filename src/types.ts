export type Interview = {
  id: string;
  company: string;
  role: string;
  date: string;
  time: string;
  location: string;
  type: "Technical" | "Behavioural" | "Mixed";
  notes: string;
  status: "Upcoming" | "Completed";
};
export type Session = {
  id: string;
  date: string;
  topic: string;
  answers: string[];
  score: number;
  questions?: Question[];
  assessments?: (Assessment | null)[];
};
export type Profile = { name: string; role: string };
export type Question = {
  id: string;
  prompt: string;
  topic: string;
  kind: "technical" | "behavioural";
  version: number;
};
export type Assessment = {
  score: number;
  kind: "technical" | "behavioural";
  summary: string;
  strengths: string[];
  improvements: string[];
  misconceptions: string[];
  confidence: "high" | "medium" | "low";
  criteria: {
    id: string;
    description: string;
    weight: number;
    points: number;
    rating: string;
    evidence: string;
    feedback: string;
  }[];
  referenceAnswer: string;
  sources: { title: string; url: string }[];
  rubricVersion: number;
  model: string;
  assessedAt: string;
};
export type PracticeSession = Session & {
  status: "draft" | "completed";
  questions: Question[];
  assessments: (Assessment | null)[];
};
export type Workspace = {
  profile: Profile;
  interviews: Interview[];
  tasks: boolean[];
};
