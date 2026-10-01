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
};
export type Profile = { name: string; role: string };
