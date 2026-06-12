import { Router } from 'express';
import Todo from '../models/Todo.js';

// A Router groups related API endpoints together.
const router = Router();

// ─── GET /api/todos ────────────────────────────────────────────────────────────
// Returns all todos from the database, newest first.
router.get('/', async (req, res) => {
  const todos = await Todo.find().sort({ createdAt: -1 });
  res.json(todos);
});

// ─── POST /api/todos ───────────────────────────────────────────────────────────
// Creates a new todo. Expects { text: "buy milk" } in the request body.
router.post('/', async (req, res) => {
  const { text } = req.body;

  // Validate: don't allow empty todos
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const todo = await Todo.create({ text: text.trim() });
  res.status(201).json(todo); // 201 means "Created"
});

// ─── PUT /api/todos/:id ────────────────────────────────────────────────────────
// Toggles a todo's completed status (done ↔ not done).
// :id is a placeholder for the actual todo's MongoDB id.
router.put('/:id', async (req, res) => {
  const todo = await Todo.findById(req.params.id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todo.completed = !todo.completed; // flip true → false or false → true
  await todo.save();
  res.json(todo);
});

// ─── DELETE /api/todos/:id ─────────────────────────────────────────────────────
// Permanently deletes a todo by its id.
router.delete('/:id', async (req, res) => {
  const todo = await Todo.findByIdAndDelete(req.params.id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.json({ message: 'Deleted successfully' });
});

export default router;
