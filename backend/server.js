import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'devSecret123';

if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI is not set.');
  process.exit(1);
}

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
});

const todoSchema = new mongoose.Schema(
  {
    text:      { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
const Todo = mongoose.model('Todo', todoSchema);

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });
  const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, name: user.name });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'All fields are required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid email or password' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, name: user.name });
});

app.get('/api/todos', auth, async (req, res) => {
  const todos = await Todo.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(todos);
});

app.post('/api/todos', auth, async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim())
    return res.status(400).json({ error: 'Text is required' });

  const todo = await Todo.create({ text: text.trim(), userId: req.user.id });
  res.status(201).json(todo);
});

app.patch('/api/todos/:id', auth, async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim())
    return res.status(400).json({ error: 'Text is required' });

  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { text: text.trim() },
    { new: true }
  );
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

app.put('/api/todos/:id', auth, async (req, res) => {
  const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  todo.completed = !todo.completed;
  await todo.save();
  res.json(todo);
});

app.delete('/api/todos/:id', auth, async (req, res) => {
  const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json({ message: 'Deleted successfully' });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
