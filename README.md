# Todo App

A full-stack todo list with per-user accounts. React frontend, Express/MongoDB backend, JWT authentication.

## Features

- **Accounts** — register, login, logout with JWT-based auth (bcrypt-hashed passwords)
- **Per-user todos** — each account only sees and manages its own list
- **CRUD** — create, complete, and delete todos
- **Auto-logout** — an invalid/expired token signs the user out automatically

## Stack

- **Frontend:** React 19 + Vite
- **Backend:** Node.js + Express + Mongoose (MongoDB)
- **Auth:** JWT + bcryptjs

## Running locally

```bash
# Backend
cd backend
npm install
cp .env.example .env   # set MONGO_URI, JWT_SECRET, CLIENT_URL
npm start              # http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## Project structure

```
backend/
  server.js          # Express app, auth routes, todo routes, models
  models/Todo.js
  routes/todos.js
frontend/
  src/App.jsx         # main UI
  src/main.jsx
```
