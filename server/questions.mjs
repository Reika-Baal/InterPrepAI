// Original questions and concise rubrics. References support the concepts; no scraped question bank.
const q = (
  id,
  topic,
  prompt,
  referenceAnswer,
  criteria,
  misconceptions,
  sources = [],
) => ({
  id,
  version: 1,
  topic,
  prompt,
  referenceAnswer,
  criteria: criteria.map(([description, weight], i) => ({
    id: `c${i + 1}`,
    description,
    weight,
  })),
  misconceptions,
  sources: sources.map(([title, url]) => ({ title, url })),
  kind: topic === "Behavioural & STAR" ? "behavioural" : "technical",
});
const d = "Data Structures & Algorithms",
  j = "Java & Object Orientation",
  b = "Behavioural & STAR";
export const bank = [
  q(
    "hash-map",
    d,
    "When would you use a hash map instead of an array? Discuss the trade-offs.",
    "A map suits lookup by keys such as user IDs. Expected lookup and update are constant time with well-distributed hashes. Arrays support constant-time indexing and compact ordered traversal; searching by value is usually linear. Maps require extra space and collision handling and do not generally preserve order.",
    [
      ["Choose keyed lookup with a concrete use case", 25],
      [
        "Distinguish expected map lookup from array indexing and linear value search",
        40,
      ],
      ["Discuss memory, collisions or ordering trade-offs", 35],
    ],
    [
      "Hash maps guarantee constant time in every case",
      "Array indexing is linear",
    ],
    [
      [
        "Oracle HashMap",
        "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html",
      ],
    ],
  ),
  q(
    "bfs-dfs",
    d,
    "Explain how breadth-first search differs from depth-first search.",
    "BFS visits successive distance layers using a queue. DFS explores a branch before backtracking using recursion or a stack. Track visited vertices to avoid cycles. Both take O(V+E) with adjacency lists. BFS finds fewest-edge paths in unweighted graphs; ordinary DFS does not guarantee that.",
    [
      ["Queue versus stack and exploration order", 40],
      ["Unweighted shortest path distinction", 35],
      ["Visited tracking and O(V+E) traversal", 25],
    ],
    ["DFS always finds shortest paths"],
    [
      [
        "Princeton BreadthFirstPaths",
        "https://algs4.cs.princeton.edu/code/edu/princeton/cs/algs4/BreadthFirstPaths.java.html",
      ],
    ],
  ),
  q(
    "linked-cycle",
    d,
    "How would you detect a cycle in a linked list?",
    "Use slow and fast references starting at the head. Move slow by one link and fast by two while fast and fast.next exist. Meeting indicates a cycle; reaching null means no cycle. This takes O(n) time and O(1) extra space. A visited-node identity set is also valid with O(n) space.",
    [
      ["Explain a valid cycle detection algorithm", 45],
      ["Handle empty list and termination safely", 25],
      ["Correct complexity for chosen method", 30],
    ],
    [
      "Compare stored values instead of node identity",
      "Fast reaching null implies a cycle",
    ],
    [
      [
        "CP-Algorithms: Floyd cycle detection",
        "https://cp-algorithms.com/others/tortoise_and_hare.html",
      ],
    ],
  ),
  q(
    "binary-search",
    d,
    "Describe the time complexity of binary search and its prerequisites.",
    "Binary search repeatedly compares the target with the middle element of a sorted range and discards the impossible half. On a random-access sequence it takes O(log n) worst-case comparisons and O(1) auxiliary space iteratively. Maintain consistent bounds; report not found when the range becomes empty. Sorting on each query changes the total cost.",
    [
      ["Sorted range or monotone predicate prerequisite", 35],
      ["Halving and logarithmic search cost", 40],
      ["Bounds, not-found case or random-access caveat", 25],
    ],
    [
      "Binary search works on arbitrary unsorted input",
      "Binary search is always O(1)",
    ],
    [
      [
        "Princeton BinarySearch",
        "https://algs4.cs.princeton.edu/code/edu/princeton/cs/algs4/BinarySearch.java.html",
      ],
    ],
  ),
  q(
    "grid-path",
    d,
    "How would you approach finding the shortest path in a grid?",
    "Treat walkable cells as vertices and legal moves as edges. With equal-cost moves, BFS gives a shortest path; use visited tracking and parent links to reconstruct it. Check bounds, obstacles and unreachable targets. For varying nonnegative costs use Dijkstra; A* is valid with appropriate heuristic and graph-search handling.",
    [
      ["Model cells, legal moves and obstacles", 25],
      [
        "Select BFS for equal costs or justify a correct weighted algorithm",
        40,
      ],
      ["Track visits and reconstruct via parents", 20],
      ["Consider unreachable target and boundaries", 15],
    ],
    ["DFS guarantees shortest path", "BFS handles arbitrary edge weights"],
    [
      [
        "Princeton BFS",
        "https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/BreadthFirstPaths.html",
      ],
      [
        "Princeton Dijkstra",
        "https://algs4.cs.princeton.edu/code/edu/princeton/cs/algs4/DijkstraSP.java.html",
      ],
    ],
  ),
  q(
    "encapsulation",
    j,
    "Explain encapsulation using an example from your own project.",
    "Keep state behind a controlled API so methods maintain invariants. For example, a puzzle board can keep its cells private and expose a move operation that rejects illegal paths. Merely adding unrestricted setters does not protect invariants.",
    [
      ["Explain controlled access to internal state", 35],
      ["Describe an invariant protected by methods", 35],
      ["Give a coherent concrete example", 30],
    ],
    ["Encapsulation is just making every field public with getters"],
    [
      [
        "Oracle access control",
        "https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html",
      ],
    ],
  ),
  q(
    "interfaces",
    j,
    "How do interfaces differ from abstract classes in modern Java?",
    "An abstract class can hold instance state, constructors and implemented or abstract methods; a class extends only one class. Interfaces define a contract and support multiple implementation. Modern interfaces may have default, static and private methods, but no per-object fields or constructors. Use an abstract class for shared state or implementation when appropriate.",
    [
      ["Single class inheritance versus multiple interfaces", 30],
      ["State and constructors distinction", 35],
      ["Modern interface methods and suitable use cases", 35],
    ],
    [
      "Interfaces can never contain implemented methods",
      "Java classes extend multiple classes",
    ],
    [
      [
        "Oracle abstract classes",
        "https://docs.oracle.com/javase/tutorial/java/IandI/abstract.html",
      ],
      [
        "Java 21 interfaces specification",
        "https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html",
      ],
    ],
  ),
  q(
    "equality",
    j,
    "What is the difference between equals() and == in Java?",
    "For references, == tests whether both point to the same object (or are both null). equals tests the equality defined by the class; Object defaults to identity while String compares character content. For primitives == compares values. Equal objects must have equal hash codes when equals is overridden.",
    [
      ["Reference identity versus class-defined equality", 40],
      ["Primitive or String example", 30],
      ["Object default or equals/hashCode contract", 30],
    ],
    [
      "equals always compares memory addresses",
      "== always compares String contents",
    ],
    [
      [
        "Oracle Object contract",
        "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html",
      ],
    ],
  ),
  q(
    "exceptions",
    j,
    "How would you handle exceptions in a Java application?",
    "Catch specific exceptions where recovery or useful translation is possible; otherwise propagate them. Preserve causes and avoid silently swallowing failures. Checked exceptions must be caught or declared, unlike unchecked exceptions. Use try-with-resources for AutoCloseable resources and show users useful messages without leaking internals.",
    [
      ["Specific handling and recovery or propagation", 35],
      ["Checked versus unchecked distinction", 25],
      ["Resource cleanup", 20],
      ["Preserve diagnostic cause without leaking details", 20],
    ],
    [
      "Catch and ignore every Exception",
      "A finally block is unnecessary for all resources",
    ],
    [
      [
        "Oracle exceptions",
        "https://docs.oracle.com/javase/tutorial/essential/exceptions/",
      ],
    ],
  ),
  q(
    "layers",
    j,
    "Describe how you would separate UI, business logic and persistence.",
    "The UI gathers input and displays outcomes. A service layer applies business rules. A repository isolates database operations behind an interface. Inject dependencies so services can be tested without a real database and UI changes do not rewrite business rules. Validate trust boundaries and place transactions around related writes.",
    [
      ["Separate presentation, rules and storage responsibilities", 40],
      ["Dependency interfaces or injection", 25],
      ["Testing and change-isolation benefits", 25],
      ["Validation or transaction handling", 10],
    ],
    ["SQL belongs in every UI event handler"],
    [
      [
        "Microsoft architectural principles",
        "https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/architectural-principles",
      ],
    ],
  ),
  ...[
    [
      "problem",
      "Tell me about a time you solved a difficult problem.",
      "Explain the difficulty, your responsibility, the options you considered and your own actions. Give the outcome and what you would reuse or improve.",
    ],
    [
      "teamwork",
      "Describe a time you worked effectively in a team.",
      "Describe the shared goal and your specific contribution. Explain how you communicated or resolved disagreement, and the outcome for the team.",
    ],
    [
      "deadline",
      "How have you handled a deadline when priorities changed?",
      "Describe the changed constraints, how you prioritised work and communicated trade-offs, and the result. Explain what you learned about planning.",
    ],
    [
      "mistake",
      "Tell me about a mistake you made and what you learned.",
      "Take ownership of a specific mistake, explain how you corrected it and describe a concrete change that helped prevent recurrence.",
    ],
  ].map(([id, prompt, ref]) =>
    q(
      id,
      b,
      prompt,
      ref,
      [
        ["Specific situation and responsibility", 20],
        ["Clear personal actions and reasoning", 40],
        ["Outcome supported by detail", 25],
        ["Relevant reflection or learning", 15],
      ],
      ["Unsupported invented numerical results should not be requested"],
      [],
    ),
  ),
  q(
    "motivation",
    b,
    "Why are you interested in this role?",
    "Connect specific aspects of the role to your experience and interests. Explain what you can contribute and what you want to learn. If employer or role details are not supplied, assess the relevance and specificity of the explanation without claiming to verify employer facts.",
    [
      ["Specific motivation linked to role", 35],
      ["Evidence from interests or experience", 35],
      ["Contribution and learning goals", 30],
    ],
    ["Generic enthusiasm alone demonstrates role knowledge"],
    [],
  ),
];
