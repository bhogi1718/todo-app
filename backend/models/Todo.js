import mongoose from 'mongoose';

// A "schema" is like a blueprint that describes the shape of each todo in the database.
const todoSchema = new mongoose.Schema(
  {
    text: {
      type: String,       // the todo item is stored as text
      required: true,     // can't save a todo without text
      trim: true,         // removes extra spaces from both ends
    },
    completed: {
      type: Boolean,      // true = done, false = not done
      default: false,     // new todos start as not completed
    },
  },
  {
    timestamps: true,     // automatically adds createdAt and updatedAt fields
  }
);

// Create a "model" from the schema — this is what we use to read/write todos in MongoDB.
const Todo = mongoose.model('Todo', todoSchema);

export default Todo;
