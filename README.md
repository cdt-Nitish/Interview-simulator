# 🤖 AI Mock Interview Practice

> An AI-powered platform that simulates real interview experiences using **Gemini AI, MediaPipe, Node.js, JavaScript, and MySQL**.

---

## 📌 Project Overview

**AI Mock Interview Practice** is a web-based platform designed to help students and job seekers practice technical and HR interviews.

The system generates interview questions using **Gemini AI**, analyzes basic face and eye-related signals using **MediaPipe**, evaluates answers using AI, and stores interview performance in **MySQL**.

### 🎯 Main Goal

```text
        👨‍💻 USER
           │
           ▼
   🎤 MOCK INTERVIEW
           │
     ┌─────┴─────┐
     ▼           ▼
 🤖 Gemini    👁️ MediaPipe
     │           │
     └─────┬─────┘
           ▼
      📊 ANALYSIS
           │
           ▼
      💾 MySQL
           │
           ▼
   📈 PERFORMANCE
```

---

# ✨ Key Features

### 👤 User Management

* User registration and login
* Secure authentication
* Personal interview history

### 🤖 AI Interview

* AI-generated questions
* Technical and HR interviews
* Role-based questions
* Difficulty selection
* Dynamic questions using Gemini

### 🎥 Interview Monitoring

* Webcam integration
* Face detection
* Eye-related tracking
* Facial landmark analysis using MediaPipe

### 📊 AI Evaluation

* Answer evaluation
* Score generation
* Strengths and weaknesses
* Improvement suggestions
* Overall interview feedback

### 📈 Performance Dashboard

* Previous interview results
* Average score
* Interview history
* Performance tracking

---

# 🛠️ Technology Stack

| Technology    | Purpose                          |
| ------------- | -------------------------------- |
| 🌐 HTML5      | Website structure                |
| 🎨 CSS3       | UI and responsive design         |
| ⚡ JavaScript  | Frontend functionality           |
| 🟢 Node.js    | Backend runtime                  |
| 🚀 Express.js | REST API/backend                 |
| 🤖 Gemini API | AI questions & evaluation        |
| 👁️ MediaPipe | Face/eye landmark analysis       |
| 🗄️ MySQL     | Data storage                     |
| 🔗 REST API   | Frontend ↔ Backend communication |

---

# 🏗️ System Architecture

```text
                    👤 USER
                      │
                      ▼
            ┌──────────────────┐
            │    FRONTEND      │
            │ HTML + CSS + JS  │
            └────────┬─────────┘
                     │
             ┌───────┴───────┐
             │               │
             ▼               ▼
      👁️ MediaPipe      🔗 REST API
      Face / Eye             │
      Analysis               ▼
                     ┌───────────────┐
                     │ Node.js +     │
                     │ Express.js    │
                     └───────┬───────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
             🤖 Gemini               🗄️ MySQL
              AI API                Database
                  │                     │
                  └──────────┬──────────┘
                             ▼
                    📊 FINAL RESULT
```

---

# 🔄 Complete Working Flow

The complete interview process works like this:

```text
1️⃣ REGISTER / LOGIN
        │
        ▼
2️⃣ SELECT INTERVIEW
   ├── Role
   ├── Type
   ├── Difficulty
   └── Questions
        │
        ▼
3️⃣ CREATE INTERVIEW SESSION
        │
        ▼
4️⃣ GEMINI GENERATES QUESTIONS
        │
        ▼
5️⃣ START WEBCAM
        │
        ▼
6️⃣ MEDIAPIPE ANALYZES FACE/EYES
        │
        ▼
7️⃣ USER ANSWERS QUESTION
        │
        ▼
8️⃣ GEMINI EVALUATES ANSWER
        │
        ▼
9️⃣ SAVE RESULT IN MYSQL
        │
        ▼
🔟 NEXT QUESTION
        │
        ▼
   ALL QUESTIONS DONE?
        │
        ▼
1️⃣1️⃣ FINAL SCORE + FEEDBACK
        │
        ▼
1️⃣2️⃣ DASHBOARD / HISTORY
```

---

# 🎤 Interview Process

## Step 1 — Interview Setup

The user selects the interview configuration.

```text
┌─────────────────────────────┐
│     🎯 INTERVIEW SETUP      │
├─────────────────────────────┤
│ Role:       Full Stack Dev  │
│ Type:       Technical       │
│ Difficulty: Medium          │
│ Questions:  10              │
│                             │
│       [ Start Interview ]   │
└─────────────────────────────┘
```

The configuration is sent to the Node.js backend.

---

## Step 2 — AI Question Generation

Node.js sends the configuration to Gemini.

```text
User Configuration
        │
        ▼
   Node.js Server
        │
        ▼
    🤖 Gemini
        │
        ▼
  Generated Questions
        │
        ▼
      MySQL
```

Example:

> **Question:** What is the difference between `let`, `const`, and `var` in JavaScript?

Questions are generated according to the selected role and difficulty.

---

# 🎥 Step 3 — Webcam & MediaPipe

When the interview starts, the browser requests webcam access.

```text
📷 Webcam
    │
    ▼
Video Frames
    │
    ▼
👁️ MediaPipe
    │
    ▼
Facial Landmarks
    │
    ├── Face Detection
    ├── Eye Landmarks
    ├── Head Orientation
    └── Facial Features
```

The system can derive basic interview-related indicators such as face presence and eye/gaze-related signals.

> ⚠️ These measurements are approximate signals and should not be treated as definitive judgments about a person's emotions or behavior.

---

# 💬 Step 4 — Answer Evaluation

The candidate submits an answer.

```text
        QUESTION
           │
           ▼
      👨‍💻 ANSWER
           │
           ▼
      Node.js API
           │
           ▼
       🤖 Gemini
           │
     ┌─────┴─────┐
     ▼           ▼
   SCORE       FEEDBACK
     │           │
     └─────┬─────┘
           ▼
        🗄️ MySQL
```

Gemini can evaluate:

* ✅ Correctness
* 🎯 Relevance
* 📝 Completeness
* 💬 Clarity
* 💡 Explanation quality

Example:

```text
Score: 8/10

Strengths:
✓ Correct concept
✓ Good explanation

Improve:
• Add a practical example
• Explain the differences more clearly
```

---

# 🗄️ Database Design

MySQL stores the information required by the application.

### Main Tables

```text
             👤 USERS
                │
                │ 1 : N
                ▼
          🎤 INTERVIEWS
             /       \
            /         \
           ▼           ▼
     ❓ QUESTIONS    📊 METRICS
           │
           │ 1 : N
           ▼
       💬 ANSWERS
```

### Users

```text
users
├── id
├── name
├── email
├── password_hash
└── created_at
```

### Interviews

```text
interviews
├── id
├── user_id
├── interview_type
├── role
├── difficulty
├── total_questions
├── total_score
├── status
└── created_at
```

### Questions

```text
questions
├── id
├── interview_id
├── question_text
├── question_number
└── topic
```

### Answers

```text
answers
├── id
├── interview_id
├── question_id
├── answer_text
├── score
└── feedback
```

### Interview Metrics

```text
interview_metrics
├── id
├── interview_id
├── face_detected_percentage
├── eye_contact_percentage
└── session_duration
```

---

# 🔌 API Structure

The Node.js backend provides REST APIs.

### 🔐 Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### 🎤 Interview

```http
POST /api/interviews
GET  /api/interviews/:id
POST /api/interviews/:id/start
POST /api/interviews/:id/complete
```

### ❓ Questions

```http
GET  /api/interviews/:id/questions
POST /api/interviews/:id/questions/generate
```

### 💬 Answers

```http
POST /api/interviews/:id/answers
```

### 📊 Results

```http
GET /api/interviews/:id/result
GET /api/interviews/history
```

---

# 📁 Project Structure

```text
AI-Mock-Interview/
│
├── 📂 frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── interview.html
│   ├── result.html
│   │
│   ├── 📂 css/
│   │   └── style.css
│   │
│   └── 📂 js/
│       ├── auth.js
│       ├── dashboard.js
│       ├── interview.js
│       └── camera.js
│
├── 📂 backend/
│   ├── server.js
│   │
│   ├── 📂 routes/
│   ├── 📂 controllers/
│   ├── 📂 services/
│   │   └── geminiService.js
│   ├── 📂 middleware/
│   └── 📂 config/
│       └── db.js
│
├── 📂 database/
│   └── schema.sql
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

# 🚀 Development Roadmap

The project should be developed step by step.

```text
PHASE 1 🏗️
Project Setup
HTML + CSS + JS
        │
        ▼
PHASE 2 🟢
Node.js + Express
        │
        ▼
PHASE 3 🗄️
MySQL Database
        │
        ▼
PHASE 4 🔐
Authentication
        │
        ▼
PHASE 5 🤖
Gemini Integration
        │
        ▼
PHASE 6 🎤
Interview System
        │
        ▼
PHASE 7 💬
Answer Evaluation
        │
        ▼
PHASE 8 👁️
MediaPipe Integration
        │
        ▼
PHASE 9 📊
Results + Dashboard
        │
        ▼
PHASE 10 🚀
Testing & Deployment
```

---

# 🔮 Future Scope

The platform can be expanded with:

### 🎙️ Voice Interview

Speech-to-text for spoken answers.

### 🔊 AI Interviewer

Text-to-speech for AI-generated questions.

### 📄 Resume-Based Interview

Generate questions from the user's resume.

### 💻 Coding Interview

Add a coding editor and programming questions.

### 🧠 Adaptive Difficulty

Automatically adjust question difficulty based on performance.

```text
Good Performance
       ↓
Increase Difficulty
       ↓
More Challenging Questions
```

### 📈 Advanced Analytics

```text
Interview History
       │
       ▼
Performance Data
       │
       ▼
📊 Charts & Trends
       │
       ▼
Improvement Tracking
```

---

# 🎯 Expected Result

At the end of an interview, the user receives a complete performance report.

```text
╔════════════════════════════════════╗
║       🤖 INTERVIEW RESULT          ║
╠════════════════════════════════════╣
║ Role: Full Stack Developer         ║
║ Questions: 10                      ║
║ Score: ⭐ 8.2 / 10                 ║
╠════════════════════════════════════╣
║ ✅ Strong Areas                    ║
║ • JavaScript                       ║
║ • Node.js                          ║
║                                    ║
║ 📚 Improve                         ║
║ • Database Concepts                ║
║ • System Design                    ║
╠════════════════════════════════════╣
║ 👁️ Face Detection: 96%             ║
║ 🎯 Eye/Gaze Metric: 82%            ║
║ ⏱️ Duration: 18 min                ║
╚════════════════════════════════════╝
```

---

# 🏁 Project Goal

The final goal is to create a complete interview practice ecosystem:

```text
       👨‍💻 USER
          │
          ▼
     🎤 INTERVIEW
          │
    ┌─────┴─────┐
    ▼           ▼
 🤖 GEMINI   👁️ MEDIAPIPE
    │           │
    └─────┬─────┘
          ▼
      📊 ANALYSIS
          │
          ▼
       🗄️ MYSQL
          │
          ▼
     📈 DASHBOARD
          │
          ▼
   🚀 BETTER PREPARATION
```

**Built with ❤️ using HTML, CSS, JavaScript, Node.js, Gemini AI, MediaPipe & MySQL.**
