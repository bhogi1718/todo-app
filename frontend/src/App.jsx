import { useState, useEffect } from 'react';

const API = '/api/todos';

export default function App() {
  const [text, setText] = useState('');         // input box value
  const [todos, setTodos] = useState([]);       // list of todos from backend
  const [editId, setEditId] = useState(null);   // id of the todo being edited
  const [editText, setEditText] = useState(''); // current text in the edit input

  // ── Fetch all todos when the page first loads ────────────────────────────────
  useEffect(() => {
    fetch(API)
      .then((res) => res.json())
      .then((data) => setTodos(data));
  }, []);

  // ── Add a new todo ───────────────────────────────────────────────────────────
  async function addTodo() {
    if (!text.trim()) return;

    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const newTodo = await res.json();
    setTodos([newTodo, ...todos]);
    setText('');
  }

  // ── Toggle a todo done / not done ───────────────────────────────────────────
  async function toggleTodo(id) {
    const res = await fetch(`${API}/${id}`, { method: 'PUT' });
    const updated = await res.json();
    setTodos(todos.map((t) => (t._id === id ? updated : t)));
  }

  // ── Open edit mode for a todo ────────────────────────────────────────────────
  function startEdit(todo) {
    setEditId(todo._id);       // remember which todo is being edited
    setEditText(todo.text);    // pre-fill the edit input with current text
  }

  // ── Save the edited text ─────────────────────────────────────────────────────
  async function saveEdit(id) {
    if (!editText.trim()) return;

    const res = await fetch(`${API}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: editText }),
    });

    const updated = await res.json();
    setTodos(todos.map((t) => (t._id === id ? updated : t)));
    setEditId(null);    // exit edit mode
    setEditText('');
  }

  // ── Cancel editing without saving ───────────────────────────────────────────
  function cancelEdit() {
    setEditId(null);
    setEditText('');
  }

  // ── Delete a todo ────────────────────────────────────────────────────────────
  async function deleteTodo(id) {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    setTodos(todos.filter((t) => t._id !== id));
  }

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div>
      <h1>TODO APP MERN</h1>
      <hr />

      {/* Input + Add button */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        placeholder="Enter a task..."
      />
      <button onClick={addTodo}>ADD</button>

      {/* Todo list */}
      <ul>
        {todos.map((todo) => (
          <li key={todo._id}>

            {/* If this todo is being edited, show an input box */}
            {editId === todo._id ? (
              <>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(todo._id);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  autoFocus
                />
                <button onClick={() => saveEdit(todo._id)}>SAVE</button>
                <button onClick={cancelEdit}>CANCEL</button>
              </>
            ) : (
              /* Otherwise show the todo text with action buttons */
              <>
                <span
                  onClick={() => toggleTodo(todo._id)}
                  style={{
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    cursor: 'pointer',
                    marginRight: '8px',
                  }}
                >
                  {todo.text}
                </span>
                <button onClick={() => startEdit(todo)}>EDIT</button>
                <button onClick={() => deleteTodo(todo._id)}>DELETE</button>
              </>
            )}

          </li>
        ))}
      </ul>
    </div>
  );
}
