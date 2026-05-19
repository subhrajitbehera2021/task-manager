# AI Powered Task Manager

## 📌 Project Overview

AI Powered Task Manager is a full-stack web application that helps users manage daily tasks efficiently with authentication, smart recommendations, and responsive UI.

The system uses a rule-based recommendation engine to analyze completed tasks and suggest similar productive activities.

---

# 🚀 Features

## Authentication

* User Signup
* User Login
* JWT Authentication
* Logout System

## Task Management

* Add Tasks
* Edit Tasks
* Delete Tasks
* Mark Complete / Undo
* Search Tasks
* Deadline Support
* Overdue Highlighting

## AI Features

* AI Task Suggestion while typing
* Smart Recommendation API
* Rule-Based Recommendation Engine
* Category Analysis

## UI Features

* Responsive Dashboard
* Modal-based Editing
* Smart Recommendation Section
* Modern UI Design

---

# 🛠 Tech Stack

## Frontend

* HTML
* CSS
* JavaScript

## Backend

* Node.js
* Express.js

## Database

* Supabase

## Authentication

* JWT

## Deployment

* Vercel
* Render

---

# 📡 API Endpoints

## Authentication APIs

### Signup

POST `/api/signup`

### Login

POST `/api/login`

---

## Task APIs

### Get Tasks

GET `/api/tasks`

### Add Task

POST `/api/tasks`

### Update Task

PUT `/api/tasks/:id`

### Delete Task

DELETE `/api/tasks/:id`

---

## AI Recommendation API

### Get Smart Recommendation

GET `/api/recommendations`

Response Example:

```json
{
  "model": "Rule-Based Recommendation Engine",
  "topCategory": "coding",
  "suggestion": "💻 Practice coding for 2 hours"
}
```

---

# 🌐 Live Deployment

## Frontend

[Vercel Deployment URL](https://task-manager-five-tan-14.vercel.app/)

## Backend

[Render Deployment URL](https://task-manager-0ks0.onrender.com)

---

# 👨‍💻 Developer

Subhrajit Behera
