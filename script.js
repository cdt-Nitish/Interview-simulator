/**
 * InterviewAI — Frontend Application Engine
 * Pure Vanilla JavaScript (ES6+)
 * 
 * Modular architecture ready for Node.js + Express + Gemini API + MySQL backend:
 * - REST API endpoints mapped
 * - MediaPipe video capture & telemetry HUD
 * - Client-side state machine & timer
 * - Form validation & mock session persistence
 */

'use strict';

/* ==========================================================================
   1. Configuration & Global State
   ========================================================================== */

const CONFIG = {
  USE_MOCK_BACKEND: true, // Toggle to false when connecting to Node.js backend
  API_BASE_URL: '/api',
  DEFAULT_ROLE: 'Full Stack Developer',
  DEFAULT_TYPE: 'Technical',
  DEFAULT_DIFFICULTY: 'Medium',
  DEFAULT_QUESTION_COUNT: 5
};

// Global App State
const state = {
  currentUser: JSON.parse(localStorage.getItem('interviewai_user')) || {
    name: 'Candidate Alex',
    email: 'alex@example.com',
    targetRole: 'Full Stack Developer'
  },
  activeInterview: null,
  currentQuestionIndex: 0,
  answers: {}, // questionId -> answer text
  sessionSeconds: 0,
  timerInterval: null,
  cameraStream: null,
  isCameraActive: false,
  mediaPipeInterval: null,
  simulatedMetrics: {
    eyeContact: 92,
    facePresence: 98,
    orientation: 'CENTERED'
  }
};

/* ==========================================================================
   2. Question Bank (Categorized by Domain, Type & Difficulty)
   Backend Ready: Later replaced by GET /api/interviews/:id/questions
   ========================================================================== */

const QUESTION_BANK = {
  'Full Stack Developer': [
    {
      id: 'fs-1',
      question: 'Explain how Node.js handles asynchronous operations using the Event Loop and Libuv.',
      topic: 'Node.js Architecture',
      difficulty: 'Medium',
      hints: ['Call stack vs Event loop', 'Libuv thread pool', 'Microtasks vs Macrotasks'],
      sampleAnswer: 'Node.js uses a single-threaded event-driven architecture powered by V8 and Libuv. The main JavaScript thread executes synchronous code on the call stack. When an asynchronous operation like I/O or a timer is encountered, it is delegated to the Libuv thread pool or the operating system kernel. Once complete, callbacks are queued into specific phases (timers, I/O callbacks, check phase for setImmediate) with promise microtasks having priority over regular macrotasks.',
      keywords: ['event loop', 'libuv', 'single-threaded', 'thread pool', 'callback', 'microtask', 'non-blocking']
    },
    {
      id: 'fs-2',
      question: 'How do you design a secure JWT authentication flow between a Single Page App and an Express/MySQL backend?',
      topic: 'Authentication & Security',
      difficulty: 'Medium',
      hints: ['HTTP-only cookies', 'Access vs Refresh tokens', 'CSRF protection'],
      sampleAnswer: 'A secure JWT flow utilizes short-lived access tokens (e.g., 15 minutes) and long-lived refresh tokens stored securely in HTTP-only, SameSite=Strict cookies to protect against XSS attacks. The client sends the access token in the Authorization header. When it expires, a silent refresh request is triggered against the refresh token endpoint, which rotates the refresh token and returns a new access token while checking against revoked tokens in the MySQL database.',
      keywords: ['jwt', 'access token', 'refresh token', 'http-only', 'cookie', 'csrf', 'xss', 'authorization']
    },
    {
      id: 'fs-3',
      question: 'Compare SQL indexing strategies (B-Tree vs Hash) and how you optimize slow queries in MySQL.',
      topic: 'Database Performance',
      difficulty: 'Medium',
      hints: ['EXPLAIN plan', 'Composite indexes', 'Range scans'],
      sampleAnswer: 'MySQL primarily uses B-Tree indexes for InnoDB, which support equality lookups, range queries (<, >), and prefix matching with O(log N) complexity. Hash indexes only support exact equality. To optimize slow queries, we first run EXPLAIN on the SQL query to inspect whether a full table scan is occurring, verify index selectivity, avoid wildcard prefixes like LIKE %term, and create compound indexes adhering to the leftmost prefix rule.',
      keywords: ['index', 'b-tree', 'explain', 'innodb', 'slow query', 'composite index', 'table scan']
    },
    {
      id: 'fs-4',
      question: 'What is the Critical Rendering Path in modern browsers and how do you optimize it?',
      topic: 'Frontend Optimization',
      difficulty: 'Senior',
      hints: ['DOM & CSSOM', 'Render tree', 'Reflow & Repaint'],
      sampleAnswer: 'The Critical Rendering Path is the sequence of steps browsers take to convert HTML, CSS, and JavaScript into pixels on screen: parsing HTML into the DOM, CSS into the CSSOM, combining them into the Render Tree, computing Layout/Reflow, and finally Painting. Optimization includes inlining critical CSS, deferring non-critical scripts with async/defer, optimizing Web Vitals (LCP, CLS), and minimizing DOM thrashing.',
      keywords: ['critical rendering path', 'dom', 'cssom', 'render tree', 'reflow', 'repaint', 'async', 'defer', 'web vitals']
    },
    {
      id: 'fs-5',
      question: 'How would you architect a real-time collaborative feature (e.g., live notifications or document sync)?',
      topic: 'System Architecture',
      difficulty: 'Senior',
      hints: ['WebSockets vs SSE', 'Redis Pub/Sub', 'State reconciliation'],
      sampleAnswer: 'For bi-directional low-latency collaboration, WebSockets (or SSE for unidirectional feeds) are ideal. In a distributed backend, Express instances connect to a Redis Pub/Sub cluster or Kafka so events scale across multiple server nodes. For state reconciliation in collaborative text editing, we apply CRDTs (Conflict-free Replicated Data Types) or Operational Transformation (OT) to resolve concurrent edits cleanly.',
      keywords: ['websocket', 'pub/sub', 'redis', 'real-time', 'crdt', 'scalability', 'concurrency']
    }
  ],

  'Frontend Developer': [
    {
      id: 'fe-1',
      question: 'What is Event Delegation in JavaScript and what problem does it solve?',
      topic: 'JavaScript Fundamentals',
      difficulty: 'Junior',
      hints: ['Event bubbling', 'Memory consumption', 'event.target'],
      sampleAnswer: 'Event delegation is a technique where instead of adding event listeners to multiple child elements, a single listener is added to a common parent. It relies on the event bubbling phase where events bubble up the DOM tree. When triggered, event.target indicates the actual element clicked. This dramatically conserves memory and automatically handles dynamically inserted child elements.',
      keywords: ['event delegation', 'bubbling', 'event.target', 'memory', 'listener', 'parent']
    },
    {
      id: 'fe-2',
      question: 'Explain the difference between CSS Grid and Flexbox. When should you use one over the other?',
      topic: 'CSS Layout',
      difficulty: 'Junior',
      hints: ['1D vs 2D layout', 'Content-first vs layout-first'],
      sampleAnswer: 'Flexbox is a one-dimensional layout system designed for distributing space along either a row or a column. CSS Grid is a two-dimensional layout system capable of handling both rows and columns simultaneously. Flexbox is best for component-level items like navigation bars or button groups, while Grid is ideal for overall page structural layouts, card grids, and complex overlapping panels.',
      keywords: ['flexbox', 'grid', 'one-dimensional', 'two-dimensional', 'layout', 'axis']
    },
    {
      id: 'fe-3',
      question: 'How do JavaScript Closures work and what is a practical memory leak pitfall associated with them?',
      topic: 'JavaScript Core',
      difficulty: 'Medium',
      hints: ['Lexical scoping', 'Garbage collection', 'Detached references'],
      sampleAnswer: 'A closure is the combination of a function bundled together with references to its surrounding lexical environment. A closure allows an inner function to access an outer functions scope even after the outer function has executed. A memory leak pitfall occurs when closures inadvertently retain references to large variables or detached DOM nodes that cannot be garbage collected.',
      keywords: ['closure', 'lexical scope', 'garbage collection', 'memory leak', 'reference', 'outer function']
    },
    {
      id: 'fe-4',
      question: 'How do you optimize Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS)?',
      topic: 'Web Performance',
      difficulty: 'Senior',
      hints: ['Image preloading', 'Font display swap', 'Explicit dimension attributes'],
      sampleAnswer: 'To optimize LCP, ensure hero images or primary heading fonts are preloaded with rel=preload, serve responsive next-gen image formats (AVIF/WebP), and minimize server response time (TTFB). To prevent CLS, always define explicit width and height dimensions or aspect-ratio on images and embeds, reserve space for dynamic ads/banners, and use font-display: optional or match fallback font metrics.',
      keywords: ['lcp', 'cls', 'core web vitals', 'preload', 'aspect-ratio', 'font-display', 'ttfb']
    },
    {
      id: 'fe-5',
      question: 'Describe how the browser handles CORS and explain what a preflight request is.',
      topic: 'Web Security & Networking',
      difficulty: 'Medium',
      hints: ['OPTIONS method', 'Access-Control-Allow-Origin', 'Simple vs Preflighted'],
      sampleAnswer: 'CORS (Cross-Origin Resource Sharing) is a browser security mechanism that restricts HTTP requests made by scripts across different origins. If a request uses methods other than GET/POST or contains custom headers, the browser automatically sends an OPTIONS preflight request. The server must respond with appropriate Access-Control-Allow-Origin, Methods, and Headers before the browser dispatches the actual request.',
      keywords: ['cors', 'preflight', 'options', 'origin', 'headers', 'cross-origin', 'security']
    }
  ],

  'Backend Developer': [
    {
      id: 'be-1',
      question: 'What are database transactions, and how does the ACID model guarantee data integrity?',
      topic: 'Databases',
      difficulty: 'Medium',
      hints: ['Atomicity, Consistency, Isolation, Durability', 'Rollback mechanics'],
      sampleAnswer: 'A database transaction is a sequence of read and write operations treated as a single unit of work. ACID guarantees reliability: Atomicity ensures all operations succeed or all rollback; Consistency ensures the database transitions between valid states respecting constraints; Isolation prevents concurrent transactions from interfering; and Durability ensures committed changes survive server crashes.',
      keywords: ['acid', 'atomicity', 'consistency', 'isolation', 'durability', 'transaction', 'rollback', 'commit']
    },
    {
      id: 'be-2',
      question: 'How does Node.js cluster module or worker threads differ when scaling high-CPU workloads?',
      topic: 'Node.js Internals',
      difficulty: 'Senior',
      hints: ['Multi-process vs Multi-thread', 'Memory isolation', 'IPC communication'],
      sampleAnswer: 'The cluster module forks multiple independent Node.js processes that share the same server port using OS-level round-robin socket distribution. Each process has its own memory heap and V8 instance. Worker threads run within the same process sharing memory via SharedArrayBuffer. For high-CPU tasks (e.g. image processing or encryption), worker threads avoid process creation overhead, while cluster is preferred for multi-core HTTP scaling.',
      keywords: ['cluster', 'worker threads', 'multi-core', 'process', 'memory', 'cpu-bound', 'v8']
    },
    {
      id: 'be-3',
      question: 'Explain the principles of RESTful API design and how idempotency applies to HTTP methods.',
      topic: 'API Design',
      difficulty: 'Junior',
      hints: ['GET, PUT, DELETE idempotency', 'Resource-oriented URIs', 'Status codes'],
      sampleAnswer: 'REST is an architectural style based on stateless client-server interactions with standard HTTP methods manipulating identified resources via URIs. Idempotency means making multiple identical requests has the same outcome as a single request. GET, PUT, and DELETE are idempotent; POST is typically non-idempotent because repeated submissions create new resources.',
      keywords: ['rest', 'idempotent', 'http methods', 'get', 'post', 'put', 'delete', 'stateless']
    },
    {
      id: 'be-4',
      question: 'What strategies do you use for caching and cache invalidation in distributed backend systems?',
      topic: 'System Scalability',
      difficulty: 'Senior',
      hints: ['Cache-aside pattern', 'Write-through', 'TTL expiration'],
      sampleAnswer: 'A common pattern is Cache-Aside where the backend checks Redis first; on a cache miss, data is read from MySQL and cached with a sensible TTL. Invalidation strategies include explicit eviction on writes, write-through caching, and versioned cache keys. For high-concurrency systems, we also guard against cache stampede using probabilistic early expiration or mutex locks.',
      keywords: ['cache', 'redis', 'cache-aside', 'ttl', 'invalidation', 'stampede', 'write-through']
    },
    {
      id: 'be-5',
      question: 'How do you prevent SQL Injection and protect API endpoints from Denial-of-Service (DoS)?',
      topic: 'Backend Security',
      difficulty: 'Medium',
      hints: ['Parameterized queries', 'Rate limiting', 'Input validation'],
      sampleAnswer: 'To prevent SQL injection, always use parameterized queries or prepared statements rather than string concatenation, ensuring user input is treated strictly as data. For DoS protection, implement IP and token-based rate limiting (e.g. with express-rate-limit and Redis), enforce request body size limits, sanitize inputs, and set strict timeouts on upstream database queries.',
      keywords: ['sql injection', 'parameterized', 'prepared statement', 'rate limiting', 'dos', 'sanitize']
    }
  ],

  'Technical': [
    {
      id: 'tc-1',
      question: 'Explain the difference between an Array and a Linked List in terms of time complexity for common operations.',
      topic: 'Data Structures',
      difficulty: 'Junior',
      hints: ['Indexing', 'Insertion/Deletion', 'Memory locality'],
      sampleAnswer: 'Arrays store elements in contiguous memory locations, providing O(1) random access indexing, but O(N) insertion or deletion except at the end. Linked lists consist of nodes with pointers, offering O(1) insertion or deletion when the node pointer is known, but O(N) lookup as traversal from the head is required. Arrays benefit significantly from CPU cache locality.',
      keywords: ['array', 'linked list', 'time complexity', 'o(1)', 'o(n)', 'memory locality', 'pointers']
    },
    {
      id: 'tc-2',
      question: 'How does Binary Search work and what preconditions must be met before executing it?',
      topic: 'Algorithms',
      difficulty: 'Junior',
      hints: ['Sorted collection', 'Divide and conquer', 'O(log N)'],
      sampleAnswer: 'Binary Search is a divide-and-conquer algorithm that locates an element in a sorted collection in O(log N) time. It repeatedly compares the target value to the middle element: if equal, search terminates; if target is smaller, the upper half is discarded; otherwise, the lower half is discarded. The fundamental precondition is that the collection must be sorted.',
      keywords: ['binary search', 'sorted', 'divide and conquer', 'o(log n)', 'middle element']
    },
    {
      id: 'tc-3',
      question: 'Describe how a Hash Table handles collisions and what affects its load factor.',
      topic: 'Data Structures',
      difficulty: 'Medium',
      hints: ['Chaining vs Open Addressing', 'Hash function distribution', 'Resizing'],
      sampleAnswer: 'A hash table maps keys to indices using a hash function. Collisions occur when two distinct keys hash to the same bucket. Common resolution methods are Separate Chaining (linked lists or balanced trees at each bucket) and Open Addressing (linear probing, quadratic probing). The load factor (number of elements / number of buckets) triggers dynamic resizing when it exceeds a threshold (typically 0.75).',
      keywords: ['hash table', 'collision', 'chaining', 'open addressing', 'load factor', 'hash function']
    },
    {
      id: 'tc-4',
      question: 'What is the difference between Synchronous and Asynchronous programming models?',
      topic: 'Computer Systems',
      difficulty: 'Junior',
      hints: ['Blocking vs Non-blocking', 'Execution thread', 'Callbacks/Promises'],
      sampleAnswer: 'Synchronous execution is blocking: each instruction must complete before the next instruction executes. Asynchronous execution is non-blocking: long-running tasks like disk I/O or network requests run concurrently or in the background, allowing the main program to continue executing. Results are handled via callbacks, promises, or async/await when ready.',
      keywords: ['synchronous', 'asynchronous', 'blocking', 'non-blocking', 'concurrency', 'thread']
    },
    {
      id: 'tc-5',
      question: 'What is Recursion and how can a deep recursive call cause a Stack Overflow?',
      topic: 'Algorithms',
      difficulty: 'Junior',
      hints: ['Base case', 'Call stack frames', 'Tail call optimization'],
      sampleAnswer: 'Recursion occurs when a function calls itself to solve a smaller subproblem. Every recursive call pushes a new stack frame containing local variables and return address onto the call stack. If the recursion lacks a proper base case or exceeds the call stack memory limit, it throws a Stack Overflow error. Tail call optimization can mitigate this if supported by the runtime.',
      keywords: ['recursion', 'base case', 'call stack', 'stack overflow', 'stack frame']
    }
  ],

  'Behavioral': [
    {
      id: 'bh-1',
      question: 'Describe a situation where you had a disagreement with a team member over a technical decision. How did you resolve it?',
      topic: 'Conflict Resolution (STAR)',
      difficulty: 'Medium',
      hints: ['Situation & Task', 'Action taken with empathy', 'Result achieved'],
      sampleAnswer: 'In a previous project, a teammate wanted to use a NoSQL database while I advocated for PostgreSQL due to relational data integrity requirements. I scheduled a technical review where we benchmarked both against our project schema, evaluated transaction consistency trade-offs, and agreed on PostgreSQL with a JSONB column to accommodate flexible fields. This resolved the debate objectively and delivered the project without data corruption.',
      keywords: ['disagreement', 'objective', 'trade-offs', 'communication', 'benchmark', 'compromise', 'result']
    },
    {
      id: 'bh-2',
      question: 'Tell me about a time when a critical bug occurred in production. How did you handle the situation?',
      topic: 'Pressure & Problem Solving',
      difficulty: 'Medium',
      hints: ['Immediate triage', 'Root cause analysis', 'Post-mortem prevention'],
      sampleAnswer: 'During a release, an unhandled null exception disrupted payment processing for 10% of users. I immediately alerted the team, rolled back to the previous stable release within 5 minutes, and isolated the root cause in the webhook parsing logic. After writing unit tests to reproduce and fix the defect, we implemented a regression test suite and established canary deployments to prevent recurrence.',
      keywords: ['production bug', 'rollback', 'root cause', 'triage', 'post-mortem', 'prevention']
    },
    {
      id: 'bh-3',
      question: 'Give an example of a project where you had to work with tight deadlines and ambiguous requirements.',
      topic: 'Agility & Prioritization',
      difficulty: 'Medium',
      hints: ['Deconstruction into MVP', 'Continuous stakeholder feedback', 'Pivoting'],
      sampleAnswer: 'When asked to build a reporting dashboard in two weeks with vague specifications, I scheduled an initial 30-minute sync with the product manager to identify the three must-have metrics for an MVP. I wireframed the core views, worked in two-day milestone review cycles, and delivered the working dashboard on time while deferring secondary export features to the following sprint.',
      keywords: ['deadline', 'ambiguous', 'mvp', 'prioritization', 'communication', 'stakeholders']
    },
    {
      id: 'bh-4',
      question: 'How do you handle receiving critical code review feedback on an approach you invested substantial time building?',
      topic: 'Professional Growth & Receptivity',
      difficulty: 'Junior',
      hints: ['Separating ego from code', 'Constructive evaluation', 'Collaborative learning'],
      sampleAnswer: 'I view code reviews as an opportunity for code quality and mutual learning, not personal criticism. When a senior developer pointed out scalability concerns in my proposed caching strategy, I thanked them for the insight, asked clarifying questions to understand their suggested alternative, refactored the module, and added unit tests documenting the improved design.',
      keywords: ['code review', 'feedback', 'learning', 'refactoring', 'collaboration', 'ego']
    },
    {
      id: 'bh-5',
      question: 'Describe a moment when you took initiative to improve an existing process or solve a problem outside your core duties.',
      topic: 'Ownership & Initiative',
      difficulty: 'Senior',
      hints: ['Identifying bottleneck', 'Proposing solution', 'Quantifiable impact'],
      sampleAnswer: 'I noticed our local development onboarding took new team members two full days due to manual environment setup. I voluntarily created a unified Docker Compose configuration with automated seeding scripts and updated documentation. This reduced onboarding time from two days to under 20 minutes for subsequent joiners.',
      keywords: ['initiative', 'ownership', 'process improvement', 'automation', 'impact']
    }
  ],

  'HR': [
    {
      id: 'hr-1',
      question: 'Walk me through your background and why you are interested in this specific role.',
      topic: 'Career Trajectory',
      difficulty: 'Junior',
      hints: ['Concise summary', 'Key accomplishments', 'Alignment with team mission'],
      sampleAnswer: 'I am a software engineer with a strong focus on building responsive, high-performance web applications using modern JavaScript and scalable backend architectures. I have engineered full-stack projects connecting intuitive user interfaces with robust REST APIs and databases. I am specifically interested in this role because your teams focus on engineering excellence and AI-driven platforms directly aligns with my passion for creating intelligent developer tools.',
      keywords: ['background', 'experience', 'accomplishments', 'passion', 'alignment', 'growth']
    },
    {
      id: 'hr-2',
      question: 'Where do you see your engineering skills and career progression in the next 3 to 5 years?',
      topic: 'Long-term Goals',
      difficulty: 'Junior',
      hints: ['Skill depth', 'Leadership/Mentorship', 'Impact'],
      sampleAnswer: 'In the next 3 to 5 years, I aim to master distributed system design and cloud architecture while deepening my expertise in AI/ML model integration. I also look forward to taking on technical leadership responsibilities, mentoring junior developers, and contributing to architectural decisions that drive product scalability.',
      keywords: ['career goals', 'leadership', 'architecture', 'growth', 'mastery', 'mentorship']
    },
    {
      id: 'hr-3',
      question: 'How do you prioritize competing deadlines when multiple tasks require urgent attention?',
      topic: 'Time Management',
      difficulty: 'Junior',
      hints: ['Eisenhower matrix / Impact vs Urgency', 'Transparent communication'],
      sampleAnswer: 'I evaluate tasks based on business impact and true urgency rather than simply working on whatever arrives first. When priorities collide, I communicate proactively with project leads to align on trade-offs, break large deliverables into manageable milestones, and maintain focus on the highest-priority deliverable without compromising code quality.',
      keywords: ['prioritization', 'urgency', 'impact', 'communication', 'trade-offs', 'time management']
    },
    {
      id: 'hr-4',
      question: 'What work environment or team culture brings out your best performance as a developer?',
      topic: 'Culture & Fit',
      difficulty: 'Junior',
      hints: ['Collaborative culture', 'Psychological safety', 'Constructive feedback'],
      sampleAnswer: 'I thrive in an environment characterized by transparency, high standards, and psychological safety where team members openly share ideas, give constructive feedback, and collaborate to solve complex technical problems. I also appreciate autonomy paired with clear objectives and continuous learning opportunities.',
      keywords: ['culture', 'collaboration', 'transparency', 'autonomy', 'feedback', 'teamwork']
    },
    {
      id: 'hr-5',
      question: 'Why should we hire you over other candidates applying for this engineering position?',
      topic: 'Value Proposition',
      difficulty: 'Medium',
      hints: ['Unique strengths', 'Fast learning ability', 'Commitment to results'],
      sampleAnswer: 'Beyond solid technical foundations in JavaScript, Node.js, and web systems, I bring strong problem-solving discipline, a relentless commitment to writing clean and testable code, and high adaptability. I communicate proactively and am dedicated to driving tangible impact from day one.',
      keywords: ['value', 'strengths', 'adaptability', 'clean code', 'impact', 'dedication']
    }
  ]
};

/* ==========================================================================
   3. Backend Interface Functions (Prepared for Node.js REST API)
   ========================================================================== */

/**
 * Generate or retrieve questions for a session
 * Corresponds to: POST /api/interviews/:id/questions/generate
 */
async function generateQuestions(config) {
  if (CONFIG.USE_MOCK_BACKEND) {
    // Select from question bank based on role or fallback to Full Stack
    const roleQuestions = QUESTION_BANK[config.role] || QUESTION_BANK['Full Stack Developer'];
    const count = parseInt(config.questionCount, 10) || 5;
    
    // Return requested number of questions
    return roleQuestions.slice(0, count);
  }

  // Real backend connection:
  const response = await fetch(`${CONFIG.API_BASE_URL}/interviews/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!response.ok) throw new Error('Failed to generate questions');
  return await response.json();
}

/**
 * Start an interview session
 * Corresponds to: POST /api/interviews
 */
async function startInterview(config) {
  const questions = await generateQuestions(config);
  
  const interviewSession = {
    id: 'int_' + Date.now(),
    role: config.role,
    type: config.type,
    difficulty: config.difficulty,
    totalQuestions: questions.length,
    questions: questions,
    createdAt: new Date().toISOString()
  };

  state.activeInterview = interviewSession;
  state.currentQuestionIndex = 0;
  state.answers = {};
  state.sessionSeconds = 0;

  return interviewSession;
}

/**
 * Submit an answer for evaluation
 * Corresponds to: POST /api/interviews/:id/answers
 */
async function submitAnswer(interviewId, questionId, answerText) {
  state.answers[questionId] = answerText;
  return { success: true, questionId, saved: true };
}

/**
 * Calculate final interview diagnostic report
 * Corresponds to: GET /api/interviews/:id/result
 */
async function getInterviewResult(interviewId) {
  const interview = state.activeInterview;
  if (!interview) return null;

  let totalScore = 0;
  const questionEvals = [];

  interview.questions.forEach((q, index) => {
    const candidateAnswer = state.answers[q.id] || '';
    const wordCount = candidateAnswer.trim().split(/\s+/).filter(Boolean).length;
    
    // Keyword match scoring heuristic simulating Gemini AI rubric
    const keywords = q.keywords || [];
    let matchedKeywords = 0;
    const lowerAns = candidateAnswer.toLowerCase();
    keywords.forEach(k => {
      if (lowerAns.includes(k.toLowerCase())) matchedKeywords++;
    });

    let qScore = 5.0; // base score
    if (wordCount >= 20) qScore += 1.5;
    if (wordCount >= 50) qScore += 1.5;
    if (keywords.length > 0) {
      const matchRatio = matchedKeywords / keywords.length;
      qScore += matchRatio * 2.0;
    }
    qScore = Math.min(9.8, Math.max(4.0, parseFloat(qScore.toFixed(1))));
    totalScore += qScore;

    questionEvals.push({
      questionNumber: index + 1,
      questionText: q.question,
      topic: q.topic,
      candidateAnswer: candidateAnswer || '(No answer provided)',
      score: qScore,
      feedback: generateQuestionFeedback(qScore, q.topic)
    });
  });

  const overallScore = parseFloat((totalScore / interview.questions.length).toFixed(1));
  const techScore = parseFloat((overallScore * 0.98 + (Math.random() * 0.4 - 0.2)).toFixed(1));
  const commScore = parseFloat((overallScore * 0.94 + (Math.random() * 0.4 - 0.2)).toFixed(1));
  const relevanceScore = parseFloat((overallScore * 0.96 + (Math.random() * 0.4 - 0.2)).toFixed(1));

  const resultReport = {
    interviewId,
    role: interview.role,
    overallScore,
    technicalScore: Math.min(10, techScore),
    communicationScore: Math.min(10, commScore),
    relevanceScore: Math.min(10, relevanceScore),
    eyeContactPercentage: state.simulatedMetrics.eyeContact,
    facePresencePercentage: state.simulatedMetrics.facePresence,
    durationSeconds: state.sessionSeconds,
    questionEvaluations: questionEvals,
    strengths: [
      `Solid foundational grasp of ${interview.role} concepts and underlying terminology.`,
      `Articulate breakdown of mechanisms and architectural trade-offs.`,
      `Consistent camera engagement and composed delivery throughout the timed session.`
    ],
    improvements: [
      `Incorporate more concrete production code snippets and edge-case caveats.`,
      `Structure answers using concise problem-solution framing before diving into deep technical specifics.`,
      `Elaborate further on concurrency handling and performance optimization under load.`
    ]
  };

  // Save to local interview history
  saveInterviewToHistory(resultReport);

  return resultReport;
}

function generateQuestionFeedback(score, topic) {
  if (score >= 8.5) {
    return `Excellent response. Accurate identification of ${topic} principles with thorough explanation of core mechanics and real-world considerations.`;
  } else if (score >= 7.0) {
    return `Good understanding of ${topic}. Covered the primary definition well; could be enhanced by giving a concrete code example and contrasting alternative solutions.`;
  } else {
    return `Foundational understanding noted for ${topic}. Response would benefit from deeper technical specificity, standard terminology, and structured clarity.`;
  }
}

/**
 * Authentication: Login
 * Corresponds to: POST /api/auth/login
 */
async function loginUser(email, password) {
  if (!email || !password) {
    throw new Error('Please enter both email and password.');
  }

  // Simulated validation
  const user = {
    name: email.split('@')[0],
    email: email,
    targetRole: 'Full Stack Developer',
    loggedInAt: new Date().toISOString()
  };

  localStorage.setItem('interviewai_user', JSON.stringify(user));
  state.currentUser = user;
  return user;
}

/**
 * Authentication: Register
 * Corresponds to: POST /api/auth/register
 */
async function registerUser(name, email, password, targetRole) {
  if (!name || !email || !password) {
    throw new Error('All required fields must be completed.');
  }

  const user = {
    name,
    email,
    targetRole: targetRole || 'Full Stack Developer',
    registeredAt: new Date().toISOString()
  };

  localStorage.setItem('interviewai_user', JSON.stringify(user));
  state.currentUser = user;
  return user;
}

/**
 * Save result to local history and update Dashboard
 */
function saveInterviewToHistory(report) {
  const history = JSON.parse(localStorage.getItem('interviewai_history')) || [];
  history.unshift({
    role: report.role,
    score: report.overallScore,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    questionCount: report.questionEvaluations.length
  });
  localStorage.setItem('interviewai_history', JSON.stringify(history));
  loadDashboard();
}

/**
 * Update the candidate dashboard metrics
 */
function loadDashboard() {
  const history = JSON.parse(localStorage.getItem('interviewai_history')) || [
    { role: 'Frontend Developer', score: 8.4, date: 'Oct 02, 2026', questionCount: 5 },
    { role: 'Backend Developer', score: 7.8, date: 'Sep 28, 2026', questionCount: 5 },
    { role: 'HR & Fit Round', score: 8.7, date: 'Sep 25, 2026', questionCount: 5 },
    { role: 'Full Stack Developer', score: 8.6, date: 'Sep 20, 2026', questionCount: 10 }
  ];

  const total = history.length;
  const avg = (history.reduce((acc, curr) => acc + curr.score, 0) / total).toFixed(1);
  const latest = history[0];

  const avgEl = document.getElementById('dashAvgScore');
  const totalEl = document.getElementById('dashTotalInterviews');
  const roleEl = document.getElementById('dashLatestRole');
  const scoreEl = document.getElementById('dashLatestScore');
  const listEl = document.getElementById('dashRecentList');

  if (avgEl) avgEl.textContent = avg;
  if (totalEl) totalEl.textContent = total;
  if (roleEl && latest) roleEl.textContent = latest.role;
  if (scoreEl && latest) scoreEl.textContent = `${latest.score} / 10`;

  if (listEl) {
    listEl.innerHTML = '';
    history.slice(0, 4).forEach(item => {
      const badgeClass = item.score >= 8.0 ? 'good' : 'average';
      const row = document.createElement('div');
      row.className = 'recent-row';
      row.innerHTML = `
        <div class="recent-info">
          <span class="recent-role">${item.role}</span>
          <span class="recent-date">${item.date} • ${item.questionCount} Questions</span>
        </div>
        <div class="recent-score-badge ${badgeClass}">${item.score}</div>
      `;
      listEl.appendChild(row);
    });
  }
}

/* ==========================================================================
   4. Webcam & MediaPipe Computer Vision Integration
   ========================================================================== */

/**
 * Request webcam video stream using navigator.mediaDevices.getUserMedia
 */
async function initCamera() {
  const videoElement = document.getElementById('camera');
  const fallback = document.getElementById('cameraFallback');
  const fallbackMsg = document.getElementById('cameraFallbackMessage');
  const statusDot = document.getElementById('cameraStatusDot');
  const hudOverlay = document.getElementById('hudOverlay');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    handleCameraError('Webcam API is not supported in this browser environment.');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      },
      audio: false
    });

    state.cameraStream = stream;
    state.isCameraActive = true;

    if (videoElement) {
      videoElement.srcObject = stream;
      videoElement.play();
    }

    if (fallback) fallback.hidden = true;
    if (hudOverlay) hudOverlay.style.display = 'flex';
    if (statusDot) statusDot.classList.add('active');

    startMediaPipeSimulation();
    showToast('Webcam connected. MediaPipe telemetry active.', 'success');
  } catch (err) {
    handleCameraError(err.name === 'NotAllowedError' 
      ? 'Camera permission was denied. Click "Request Camera Access" to retry.' 
      : 'Camera unavailable or occupied by another application.');
  }
}

function handleCameraError(msg) {
  state.isCameraActive = false;
  const fallback = document.getElementById('cameraFallback');
  const fallbackMsg = document.getElementById('cameraFallbackMessage');
  const statusDot = document.getElementById('cameraStatusDot');
  const hudOverlay = document.getElementById('hudOverlay');

  if (fallback) fallback.hidden = false;
  if (fallbackMsg) fallbackMsg.textContent = msg;
  if (statusDot) statusDot.classList.remove('active');
  if (hudOverlay) hudOverlay.style.display = 'none';

  stopMediaPipeSimulation();
  showToast(msg, 'warning');
}

/**
 * Stop camera video stream
 */
function stopCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(track => track.stop());
    state.cameraStream = null;
  }
  state.isCameraActive = false;
  stopMediaPipeSimulation();

  const videoElement = document.getElementById('camera');
  if (videoElement) videoElement.srcObject = null;

  const fallback = document.getElementById('cameraFallback');
  if (fallback) fallback.hidden = false;

  const statusDot = document.getElementById('cameraStatusDot');
  if (statusDot) statusDot.classList.remove('active');
}

/**
 * Toggle camera on/off
 */
function toggleCamera() {
  if (state.isCameraActive) {
    stopCamera();
    showToast('Camera feed paused.', 'info');
  } else {
    initCamera();
  }
}

/**
 * MediaPipe Telemetry Simulation
 * Subtly updates gaze alignment and posture metrics
 */
function startMediaPipeSimulation() {
  stopMediaPipeSimulation();
  state.mediaPipeInterval = setInterval(() => {
    // Subtle realistic variations in eye contact & presence
    const eyeVar = Math.floor(Math.random() * 5) - 2; // -2 to +2
    const presenceVar = Math.floor(Math.random() * 3) - 1; // -1 to +1

    state.simulatedMetrics.eyeContact = Math.min(99, Math.max(78, state.simulatedMetrics.eyeContact + eyeVar));
    state.simulatedMetrics.facePresence = Math.min(100, Math.max(90, state.simulatedMetrics.facePresence + presenceVar));

    const eyeEl = document.getElementById('metricEyeVal');
    const eyeBar = document.getElementById('metricEyeBar');
    const faceEl = document.getElementById('metricFaceVal');
    const faceBar = document.getElementById('metricFaceBar');

    if (eyeEl) eyeEl.textContent = `${state.simulatedMetrics.eyeContact}%`;
    if (eyeBar) eyeBar.style.width = `${state.simulatedMetrics.eyeContact}%`;
    if (faceEl) faceEl.textContent = `${state.simulatedMetrics.facePresence}%`;
    if (faceBar) faceBar.style.width = `${state.simulatedMetrics.facePresence}%`;
  }, 2000);
}

function stopMediaPipeSimulation() {
  if (state.mediaPipeInterval) {
    clearInterval(state.mediaPipeInterval);
    state.mediaPipeInterval = null;
  }
}

/* ==========================================================================
   5. Active Interview Session Controller
   ========================================================================== */

function displayCurrentQuestion() {
  const interview = state.activeInterview;
  if (!interview) return;

  const q = interview.questions[state.currentQuestionIndex];
  if (!q) return;

  // Update Question View
  const heading = document.getElementById('activeQuestionText');
  const topicBadge = document.getElementById('activeTopicBadge');
  const diffBadge = document.getElementById('activeDiffBadge');
  const qIndicator = document.getElementById('interviewQIndicator');
  const qProgressPercent = document.getElementById('interviewProgressPercent');
  const qProgressBar = document.getElementById('interviewProgressBar');
  const answerTextarea = document.getElementById('candidateAnswerInput');
  const prevBtn = document.getElementById('prevQuestionBtn');
  const nextBtn = document.getElementById('nextQuestionBtn');
  const submitBtn = document.getElementById('submitAnswerBtn');

  if (heading) heading.textContent = q.question;
  if (topicBadge) topicBadge.textContent = `TOPIC: ${q.topic.toUpperCase()}`;
  if (diffBadge) diffBadge.textContent = `DIFFICULTY: ${q.difficulty.toUpperCase()}`;

  const currentNum = state.currentQuestionIndex + 1;
  const total = interview.questions.length;
  const progressPct = Math.round((currentNum / total) * 100);

  if (qIndicator) qIndicator.textContent = `Question ${currentNum} of ${total}`;
  if (qProgressPercent) qProgressPercent.textContent = `${progressPct}%`;
  if (qProgressBar) qProgressBar.style.width = `${progressPct}%`;

  // Update hints
  if (q.hints && q.hints.length >= 3) {
    const h1 = document.getElementById('hintPill1');
    const h2 = document.getElementById('hintPill2');
    const h3 = document.getElementById('hintPill3');
    if (h1) h1.textContent = q.hints[0];
    if (h2) h2.textContent = q.hints[1];
    if (h3) h3.textContent = q.hints[2];
  }

  // Populate textarea with existing answer if available
  if (answerTextarea) {
    answerTextarea.value = state.answers[q.id] || '';
    updateTextStats(answerTextarea.value);
  }

  // Button States
  if (prevBtn) prevBtn.disabled = state.currentQuestionIndex === 0;
  if (nextBtn) {
    if (state.currentQuestionIndex === total - 1) {
      nextBtn.style.display = 'none';
      if (submitBtn) submitBtn.textContent = 'Finish Interview';
    } else {
      nextBtn.style.display = 'inline-flex';
      if (submitBtn) submitBtn.textContent = 'Submit & Next';
    }
  }

  renderQuestionNavPills();
}

function renderQuestionNavPills() {
  const container = document.getElementById('questionNavGrid');
  const interview = state.activeInterview;
  if (!container || !interview) return;

  container.innerHTML = '';
  interview.questions.forEach((q, idx) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'q-nav-pill';
    pill.textContent = idx + 1;

    if (idx === state.currentQuestionIndex) {
      pill.classList.add('active');
    }
    if (state.answers[q.id] && state.answers[q.id].trim().length > 0) {
      pill.classList.add('answered');
    }

    pill.addEventListener('click', () => {
      saveCurrentAnswerState();
      state.currentQuestionIndex = idx;
      displayCurrentQuestion();
    });

    container.appendChild(pill);
  });
}

function saveCurrentAnswerState() {
  const interview = state.activeInterview;
  if (!interview) return;
  const q = interview.questions[state.currentQuestionIndex];
  const answerTextarea = document.getElementById('candidateAnswerInput');
  if (q && answerTextarea) {
    state.answers[q.id] = answerTextarea.value;
    submitAnswer(interview.id, q.id, answerTextarea.value);
  }
}

function updateTextStats(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;

  const wordEl = document.getElementById('wordCountLabel');
  const charEl = document.getElementById('charCountLabel');
  if (wordEl) wordEl.textContent = `${words} word${words === 1 ? '' : 's'}`;
  if (charEl) charEl.textContent = `${chars} char${chars === 1 ? '' : 's'}`;
}

function startTimer() {
  stopTimer();
  state.sessionSeconds = 0;
  updateTimerDisplay();

  state.timerInterval = setInterval(() => {
    state.sessionSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('interviewTimer');
  if (!timerEl) return;

  const mins = Math.floor(state.sessionSeconds / 60);
  const secs = state.sessionSeconds % 60;
  timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Launch Active Interview Mode
 */
async function launchInterviewSession(config) {
  closeModal('setupModal');

  showToast(`Generating ${config.difficulty} questions for ${config.role}...`, 'info');

  try {
    const session = await startInterview(config);
    
    // Update active badges
    const roleBadge = document.getElementById('activeRoleBadge');
    if (roleBadge) roleBadge.textContent = `${session.role} • ${session.difficulty}`;

    // Open Screen
    const interviewScreen = document.getElementById('interviewScreen');
    if (interviewScreen) interviewScreen.hidden = false;

    displayCurrentQuestion();
    startTimer();
    initCamera();

    showToast('Interview session started. Good luck!', 'success');
  } catch (err) {
    showToast('Error initializing interview session: ' + err.message, 'error');
  }
}

/**
 * Finish Interview & Render Report
 */
async function completeInterviewSession() {
  saveCurrentAnswerState();
  stopTimer();
  stopCamera();

  const interviewScreen = document.getElementById('interviewScreen');
  if (interviewScreen) interviewScreen.hidden = true;

  showToast('Evaluating interview answers via AI...', 'info');

  try {
    const report = await getInterviewResult(state.activeInterview.id);
    renderResultReport(report);
    openModal('resultModal');
    showToast('Evaluation report ready!', 'success');
  } catch (err) {
    showToast('Error generating report: ' + err.message, 'error');
  }
}

/**
 * Render diagnostic results into the Result Modal
 */
function renderResultReport(report) {
  if (!report) return;

  const overallEl = document.getElementById('resultOverallScore');
  const techEl = document.getElementById('resultTechScore');
  const techBar = document.getElementById('resultTechBar');
  const commEl = document.getElementById('resultCommScore');
  const commBar = document.getElementById('resultCommBar');
  const relEl = document.getElementById('resultRelevanceScore');
  const relBar = document.getElementById('resultRelevanceBar');
  const eyeEl = document.getElementById('resultEyeScore');
  const eyeBar = document.getElementById('resultEyeBar');
  const titleEl = document.getElementById('resultTitle');
  const subEl = document.getElementById('resultSubtitle');
  const timestampEl = document.getElementById('resultTimestamp');

  if (titleEl) titleEl.textContent = `${report.role} Evaluation`;
  if (subEl) subEl.textContent = `Completed in ${Math.floor(report.durationSeconds / 60)}m ${report.durationSeconds % 60}s • ${report.questionEvaluations.length} Questions Evaluated`;
  if (overallEl) overallEl.textContent = report.overallScore;

  if (techEl) techEl.textContent = `${report.technicalScore} / 10`;
  if (techBar) techBar.style.width = `${report.technicalScore * 10}%`;

  if (commEl) commEl.textContent = `${report.communicationScore} / 10`;
  if (commBar) commBar.style.width = `${report.communicationScore * 10}%`;

  if (relEl) relEl.textContent = `${report.relevanceScore} / 10`;
  if (relBar) relBar.style.width = `${report.relevanceScore * 10}%`;

  if (eyeEl) eyeEl.textContent = `${report.eyeContactPercentage}%`;
  if (eyeBar) eyeBar.style.width = `${report.eyeContactPercentage}%`;

  if (timestampEl) timestampEl.textContent = `Evaluated: ${new Date().toLocaleTimeString()} (Gemini Model + MediaPipe)`;

  // Strengths List
  const strengthsUl = document.getElementById('resultStrengthsList');
  if (strengthsUl) {
    strengthsUl.innerHTML = '';
    report.strengths.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s;
      strengthsUl.appendChild(li);
    });
  }

  // Improvements List
  const improvementsUl = document.getElementById('resultImprovementsList');
  if (improvementsUl) {
    improvementsUl.innerHTML = '';
    report.improvements.forEach(i => {
      const li = document.createElement('li');
      li.textContent = i;
      improvementsUl.appendChild(li);
    });
  }

  // Questions Accordion
  const accordion = document.getElementById('resultQuestionsAccordion');
  if (accordion) {
    accordion.innerHTML = '';
    report.questionEvaluations.forEach(item => {
      const accItem = document.createElement('div');
      accItem.className = 'accordion-item';
      accItem.innerHTML = `
        <button type="button" class="accordion-trigger">
          <span class="accordion-q-title">Q${item.questionNumber}: ${item.questionText}</span>
          <span class="accordion-score-tag">${item.score} / 10</span>
        </button>
        <div class="accordion-content">
          <div class="candidate-eval-block">
            <div class="eval-lbl">YOUR ANSWER:</div>
            <div class="eval-ans-text">${escapeHtml(item.candidateAnswer)}</div>
          </div>
          <div class="candidate-eval-block">
            <div class="eval-lbl">AI EVALUATION &amp; RECOMMENDATION:</div>
            <div class="eval-feedback-text">${item.feedback}</div>
          </div>
        </div>
      `;

      accItem.querySelector('.accordion-trigger').addEventListener('click', () => {
        accItem.classList.toggle('open');
      });

      accordion.appendChild(accItem);
    });

    // Open first item by default
    if (accordion.firstElementChild) {
      accordion.firstElementChild.classList.add('open');
    }
  }
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/* ==========================================================================
   6. Modal Management & Toast Notification Utility
   ========================================================================== */

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const firstInput = modal.querySelector('input, select, textarea, button:not(.modal-close)');
    if (firstInput) firstInput.focus();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.hidden = true;
    document.body.style.overflow = '';
  }
}

function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');

  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '✕';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

/* ==========================================================================
   7. Event Listeners & Initialization
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initial dashboard load
  loadDashboard();

  // --- Mobile Hamburger Menu ---
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('open');
    });

    // Close menu when clicking any nav link
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Navigation Buttons ---
  const loginNavBtn = document.getElementById('loginNavBtn');
  const startNavBtn = document.getElementById('startNavBtn');
  const heroStartBtn = document.getElementById('heroStartBtn');
  const heroPreviewTryBtn = document.getElementById('heroPreviewTryBtn');
  const ctaStartBtn = document.getElementById('ctaStartBtn');
  const ctaRegisterBtn = document.getElementById('ctaRegisterBtn');
  const dashStartNewBtn = document.getElementById('dashStartNewBtn');

  if (loginNavBtn) loginNavBtn.addEventListener('click', () => openModal('loginModal'));
  if (startNavBtn) startNavBtn.addEventListener('click', () => openModal('setupModal'));
  if (heroStartBtn) heroStartBtn.addEventListener('click', () => openModal('setupModal'));
  if (heroPreviewTryBtn) heroPreviewTryBtn.addEventListener('click', () => openModal('setupModal'));
  if (ctaStartBtn) ctaStartBtn.addEventListener('click', () => openModal('setupModal'));
  if (ctaRegisterBtn) ctaRegisterBtn.addEventListener('click', () => openModal('registerModal'));
  if (dashStartNewBtn) dashStartNewBtn.addEventListener('click', () => openModal('setupModal'));

  // --- Switch between Login and Register ---
  const switchToRegisterBtn = document.getElementById('switchToRegisterBtn');
  const switchToLoginBtn = document.getElementById('switchToLoginBtn');

  if (switchToRegisterBtn) {
    switchToRegisterBtn.addEventListener('click', () => {
      closeModal('loginModal');
      openModal('registerModal');
    });
  }

  if (switchToLoginBtn) {
    switchToLoginBtn.addEventListener('click', () => {
      closeModal('registerModal');
      openModal('loginModal');
    });
  }

  // --- Modal Close Buttons & Backdrop Clicks ---
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      closeModal(modalId);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Global Escape key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not([hidden])').forEach(modal => {
        closeModal(modal.id);
      });
    }
  });

  // --- Category Card Click Handlers ---
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const role = card.getAttribute('data-role');
      const setupRole = document.getElementById('setupRole');
      if (setupRole && role) {
        setupRole.value = role;
      }
      openModal('setupModal');
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  // --- Footer Track Links ---
  document.querySelectorAll('[data-select]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const role = link.getAttribute('data-select');
      const setupRole = document.getElementById('setupRole');
      if (setupRole && role) {
        setupRole.value = role;
      }
      openModal('setupModal');
    });
  });

  // --- Setup Form Submission ---
  const setupForm = document.getElementById('setupForm');
  if (setupForm) {
    setupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const role = document.getElementById('setupRole').value;
      const type = document.getElementById('setupType').value;
      const difficulty = document.getElementById('setupDifficulty').value;
      const questionCount = document.getElementById('setupQuestionCount').value;

      launchInterviewSession({ role, type, difficulty, questionCount });
    });
  }

  // --- Active Interview Navigation Controls ---
  const answerTextarea = document.getElementById('candidateAnswerInput');
  if (answerTextarea) {
    answerTextarea.addEventListener('input', () => {
      updateTextStats(answerTextarea.value);
    });
  }

  const prevBtn = document.getElementById('prevQuestionBtn');
  const nextBtn = document.getElementById('nextQuestionBtn');
  const submitBtn = document.getElementById('submitAnswerBtn');
  const clearBtn = document.getElementById('clearAnswerBtn');
  const sampleBtn = document.getElementById('sampleAnswerBtn');
  const endInterviewBtn = document.getElementById('endInterviewBtn');
  const finishAllBtn = document.getElementById('finishAllBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.currentQuestionIndex > 0) {
        saveCurrentAnswerState();
        state.currentQuestionIndex--;
        displayCurrentQuestion();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const total = state.activeInterview.questions.length;
      if (state.currentQuestionIndex < total - 1) {
        saveCurrentAnswerState();
        state.currentQuestionIndex++;
        displayCurrentQuestion();
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      saveCurrentAnswerState();
      const total = state.activeInterview.questions.length;
      if (state.currentQuestionIndex < total - 1) {
        state.currentQuestionIndex++;
        displayCurrentQuestion();
        showToast('Answer recorded. Moving to next question.', 'success');
      } else {
        completeInterviewSession();
      }
    });
  }

  if (clearBtn && answerTextarea) {
    clearBtn.addEventListener('click', () => {
      answerTextarea.value = '';
      updateTextStats('');
      saveCurrentAnswerState();
      renderQuestionNavPills();
    });
  }

  if (sampleBtn && answerTextarea) {
    sampleBtn.addEventListener('click', () => {
      const q = state.activeInterview.questions[state.currentQuestionIndex];
      if (q && q.sampleAnswer) {
        answerTextarea.value = q.sampleAnswer;
        updateTextStats(q.sampleAnswer);
        saveCurrentAnswerState();
        renderQuestionNavPills();
        showToast('Sample answer inserted for evaluation testing.', 'info');
      }
    });
  }

  if (endInterviewBtn) {
    endInterviewBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to end this interview session? Your answered questions will be evaluated.')) {
        completeInterviewSession();
      }
    });
  }

  if (finishAllBtn) {
    finishAllBtn.addEventListener('click', () => {
      completeInterviewSession();
    });
  }

  // --- Camera Controls ---
  const toggleCameraBtn = document.getElementById('toggleCameraBtn');
  const retryCameraBtn = document.getElementById('retryCameraBtn');

  if (toggleCameraBtn) toggleCameraBtn.addEventListener('click', toggleCamera);
  if (retryCameraBtn) retryCameraBtn.addEventListener('click', initCamera);

  // --- Result Modal Actions ---
  const resultTryAgainBtn = document.getElementById('resultTryAgainBtn');
  const resultDashboardBtn = document.getElementById('resultDashboardBtn');

  if (resultTryAgainBtn) {
    resultTryAgainBtn.addEventListener('click', () => {
      closeModal('resultModal');
      openModal('setupModal');
    });
  }

  if (resultDashboardBtn) {
    resultDashboardBtn.addEventListener('click', () => {
      closeModal('resultModal');
      const dashSection = document.getElementById('dashboard-preview');
      if (dashSection) {
        dashSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // --- Authentication Forms Validation ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('loginEmail');
      const passInput = document.getElementById('loginPassword');
      const emailError = document.getElementById('loginEmailError');
      const passError = document.getElementById('loginPasswordError');

      emailError.textContent = '';
      passError.textContent = '';

      let isValid = true;
      if (!emailInput.value.includes('@') || !emailInput.value.includes('.')) {
        emailError.textContent = 'Please enter a valid email address.';
        isValid = false;
      }
      if (passInput.value.length < 6) {
        passError.textContent = 'Password must be at least 6 characters.';
        isValid = false;
      }

      if (!isValid) return;

      try {
        const user = await loginUser(emailInput.value, passInput.value);
        closeModal('loginModal');
        showToast(`Welcome back, ${user.name}!`, 'success');
      } catch (err) {
        passError.textContent = err.message;
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('regName');
      const emailInput = document.getElementById('regEmail');
      const roleSelect = document.getElementById('regRole');
      const passInput = document.getElementById('regPassword');
      const confirmInput = document.getElementById('regConfirmPassword');

      const nameError = document.getElementById('regNameError');
      const emailError = document.getElementById('regEmailError');
      const passError = document.getElementById('regPasswordError');
      const confirmError = document.getElementById('regConfirmPasswordError');

      nameError.textContent = '';
      emailError.textContent = '';
      passError.textContent = '';
      confirmError.textContent = '';

      let isValid = true;
      if (!nameInput.value.trim()) {
        nameError.textContent = 'Full name is required.';
        isValid = false;
      }
      if (!emailInput.value.includes('@') || !emailInput.value.includes('.')) {
        emailError.textContent = 'Please enter a valid email address.';
        isValid = false;
      }
      if (passInput.value.length < 6) {
        passError.textContent = 'Password must be at least 6 characters.';
        isValid = false;
      }
      if (passInput.value !== confirmInput.value) {
        confirmError.textContent = 'Passwords do not match.';
        isValid = false;
      }

      if (!isValid) return;

      try {
        const user = await registerUser(nameInput.value, emailInput.value, passInput.value, roleSelect.value);
        closeModal('registerModal');
        showToast(`Account created! Welcome, ${user.name}.`, 'success');
      } catch (err) {
        showToast('Registration failed: ' + err.message, 'error');
      }
    });
  }

  const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Password reset link will be sent when connected to Node.js mailer.', 'info');
    });
  }
});
