import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();

const PORT = 5000;
const MONGO_URI = 'mongodb://localhost:27017/todoapp';

// ─── Middleware ────────────────────────────────────────────────────────────────

// Allow the React frontend (port 5173) to send requests to this server
app.use(cors({ origin: 'http://localhost:5173' }));

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
