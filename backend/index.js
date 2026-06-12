import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import todosRouter from './routes/todos.js';

// ─── App setup ─────────────────────────────────────────────────────────────────

const app = express();

const PORT = 5000;                                         // port the server runs on
const MONGO_URI = 'mongodb://localhost:27017/todoapp';     // local MongoDB database URL

// ─── Middleware ────────────────────────────────────────────────────────────────
// Middleware are functions that process every request before it reaches your routes.

// Allow the frontend (running on port 5173) to talk to this backend.
app.use(cors({ origin: 'http://localhost:5173' }));

// Parse incoming JSON bodies so we can read req.body in routes.
app.use(express.json());

// ─── Routes ────────────────────────────────────────────────────────────────────
// All todo-related endpoints live under /api/todos.
// e.g. GET /api/todos, POST /api/todos, DELETE /api/todos/:id

app.use('/api/todos', todosRouter);

// ─── Connect to MongoDB, then start the server ─────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    // If we can't connect to the database there's no point running.
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  });
