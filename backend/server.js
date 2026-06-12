import 'dotenv/config';   // loads .env file when running locally
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

console.log('MONGO_URI set:', !!MONGO_URI);
console.log('MONGO_URI starts with:', MONGO_URI?.slice(0, 20));

if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI is not set. Add it in Render environment variables.');
  process.exit(1);
}

// ─── Middleware ────────────────────────────────────────────────────────────────

// Allow the frontend to send requests to this server.
// In production set CLIENT_URL in Render's environment variables.
app.use(cors({ origin: CLIENT_URL }));

// Lets us read JSON data from request bodies (req.body)
app.use(express.json());

// ─── Todo Model ────────────────────────────────────────────────────────────────

// Define the shape of a todo document in MongoDB
const todoSchema = new mongoose.Schema(
  {
    text: {
      type: String,     // todo text
      required: true,   // cannot be empty
      trim: true,       // removes extra spaces
    },
    completed: {
      type: Boolean,    // true = done, false = not done
      default: false,   // new todos start as not completed
    },
  },
  {
    timestamps: true,   // auto-adds createdAt and updatedAt
  }
);

// Create the model — we use this to interact with the "todos" collection in MongoDB
const Todo = mongoose.model('Todo', todoSchema);

// ─── Routes ────────────────────────────────────────────────────────────────────

// GET /api/todos — fetch all todos (newest first)
app.get('/api/todos', async (req, res) => {
  const todos = await Todo.find().sort({ createdAt: -1 });
  res.json(todos);
});

// POST /api/todos — create a new todo
// Frontend sends: { text: "buy milk" }
app.post('/api/todos', async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const todo = await Todo.create({ text: text.trim() });
  res.status(201).json(todo); // 201 = Created
});

// PATCH /api/todos/:id — update the text of a todo
// Frontend sends: { text: "updated task" }
app.patch('/api/todos/:id', async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const todo = await Todo.findByIdAndUpdate(
    req.params.id,
    { text: text.trim() },
    { new: true }  // return the updated document
  );

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.json(todo);
});

// PUT /api/todos/:id — toggle a todo's completed status (done ↔ not done)
app.put('/api/todos/:id', async (req, res) => {
  const todo = await Todo.findById(req.params.id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todo.completed = !todo.completed; // flip true → false or false → true
  await todo.save();
  res.json(todo);
});

// DELETE /api/todos/:id — delete a todo permanently
app.delete('/api/todos/:id', async (req, res) => {
  const todo = await Todo.findByIdAndDelete(req.params.id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.json({ message: 'Deleted successfully' });
});

// ─── Connect to MongoDB, then start the server ─────────────────────────────────

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  });
