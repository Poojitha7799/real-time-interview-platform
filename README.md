# InterviewFlow: AI-Based Technical Interview & Coding Assessment Platform

An AI-enabled full-stack interview platform that supports mock interviews, live technical interviews, role-based access, coding assessments, and interview management. The platform enables candidates to practice with AI as well as participate in real-time interviews conducted by human interviewers.

---

## Features

### Candidate

* Register and log in securely.
* Attend AI-powered mock interviews.
* Join scheduled live interview sessions.
* Solve coding problems in the integrated coding workspace.
* View interview details and assigned problems.

### Interviewer

* Join live interview sessions.
* Conduct technical interviews with candidates.
* Communicate with candidates through voice during interviews.
* Evaluate candidate performance.

### Admin

* Create and schedule interview sessions.
* Assign interviewers and candidates.
* Manage interview workflow.
* Monitor interview activities.

### AI Features

* AI-powered mock interview using Google Gemini.
* AI-generated interview questions.
* AI-based response evaluation and feedback.

---

## Tech Stack

### Frontend

* Next.js
* React.js
* JavaScript
* HTML
* CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### AI

* Google Gemini API

### Authentication

* JWT Authentication

---

## Project Structure

```text
client-app/
    Frontend (Next.js)

socket-server/
    Backend APIs
    Authentication
    AI Services
    Interview Management
    WebSocket Communication
```

---

## Key Functionalities

* AI mock interview generation
* Live interview management
* Role-based authentication (Admin, Interviewer, Candidate)
* Coding assessment workspace
* Session scheduling
* Interview evaluation
* RESTful APIs
* Secure authentication using JWT

---

## Installation

### Clone the repository

```bash
git clone https://github.com/Poojitha7799/real-time-interview-platform.git
```

### Install frontend dependencies

```bash
cd client-app
npm install
```

### Install backend dependencies

```bash
cd ../socket-server
npm install
```

### Configure environment variables

Create the following files:

```
client-app/.env.local
socket-server/.env
```

Configure:

* MongoDB Connection String
* JWT Secret
* Gemini API Key

### Run the frontend

```bash
cd client-app
npm run dev
```

### Run the backend

```bash
cd socket-server
npm run dev
```

---

## Future Enhancements

* Video interview support
* AI-generated interview reports
* Interview recording and replay
* Email notifications
* Analytics dashboard
* Multi-language interview support

---

## Author

**Poojitha Bathini**

B.Tech Computer Science and Engineering
National Institute of Technology Manipur
