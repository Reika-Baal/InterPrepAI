import type { Interview } from "./types";
const future = new Date();
future.setDate(future.getDate() + 5);
export const initialInterviews: Interview[] = [
  {
    id: "mclaren-demo",
    company: "McLaren",
    role: "Graduate IT & Digital",
    date: future.toISOString().slice(0, 10),
    time: "10:00",
    location: "Online",
    type: "Mixed",
    notes:
      "Review the role description and prepare examples of teamwork, problem solving and your Numberlink project.",
    status: "Upcoming",
  },
];
export const topics = [
  "Data Structures & Algorithms",
  "Behavioural & STAR",
  "Java & Object Orientation",
];
export const questions: Record<string, string[]> = {
  "Data Structures & Algorithms": [
    "When would you use a hash map instead of an array? Discuss the trade-offs.",
    "Explain how breadth-first search differs from depth-first search.",
    "How would you detect a cycle in a linked list?",
    "Describe the time complexity of binary search and its prerequisites.",
    "How would you approach finding the shortest path in a grid?",
  ],
  "Behavioural & STAR": [
    "Tell me about a time you solved a difficult problem.",
    "Describe a time you worked effectively in a team.",
    "How have you handled a deadline when priorities changed?",
    "Tell me about a mistake you made and what you learned.",
    "Why are you interested in this role?",
  ],
  "Java & Object Orientation": [
    "Explain encapsulation using an example from your own project.",
    "How do interfaces differ from abstract classes in Java?",
    "What is the difference between equals() and ==?",
    "How would you handle exceptions in a Java application?",
    "Describe how you would separate UI, business logic and persistence.",
  ],
};
