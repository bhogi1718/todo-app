import { useState, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_URL;
const API = `${BASE}/api/todos`;
const AUTH = `${BASE}/api/auth`;

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function App() {
  const [token, setToken]       = useState(() => localStorage.getItem('token') || '');
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || '');
  const [page, setPage]         = useState('login'); // 'login' | 'register' | 'todos'

  const [form, setForm]         = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  const [todos, setTodos]       = useState([]);
  const [text, setText]         = useState('');
  const [editId, setEditId]     = useState(null);
  const [editText, setEditText] = useState('');

  // ── If already logged in, go straight to todos ──────────────────────────────
  useEffect(() => {
    if (token) setPage('todos');
  }, []);

  // ── Fetch todos when on todos page ──────────────────────────────────────────
  useEffect(() => {
    if (page !== 'todos' || !token) return;
    fetch(API, { headers: authHeaders(token) })
      .then((r) => {
        if (r.status === 401) { logout(); return null; }
        return r.json();
      })
      .then((data) => data && Array.isArray(data) && setTodos(data));
  }, [page]);

  // ── Auth ─────────────────────────────────────────────────────────────────────
  async function handleAuth(e) {
    e.preventDefault();
    setAuthError('');
    const url = page === 'login' ? `${AUTH}/login` : `${AUTH}/register`;
    const body = page === 'login'
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return setAuthError(data.error);

    localStorage.setItem('token', data.token);
    localStorage.setItem('userName', data.name);
    setToken(data.token);
    setUserName(data.name);
    setPage('todos');
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setToken('');
    setUserName('');
    setTodos([]);
    setPage('login');
  }

  // ── Todo actions ──────────────────────────────────────────────────────────────
  async function addTodo() {
    if (!text.trim()) return;
    const res = await fetch(API, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ text }),
    });
    const newTodo = await res.json();
    setTodos([newTodo, ...todos]);
    setText('');
  }

  async function toggleTodo(id) {
    const res = await fetch(`${API}/${id}`, { method: 'PUT', headers: authHeaders(token) });
    const updated = await res.json();
    setTodos(todos.map((t) => (t._id === id ? updated : t)));
  }

  async function saveEdit(id) {
    if (!editText.trim()) return;
    const res = await fetch(`${API}/${id}`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ text: editText }),
    });
    const updated = await res.json();
    setTodos(todos.map((t) => (t._id === id ? updated : t)));
    setEditId(null);
    setEditText('');
  }

  async function deleteTodo(id) {
    await fetch(`${API}/${id}`, { method: 'DELETE', headers: authHeaders(token) });
    setTodos(todos.filter((t) => t._id !== id));
  }

  // ── Auth forms ────────────────────────────────────────────────────────────────
  if (page === 'login' || page === 'register') {
    return (
      <div>
        <h1>TODO APP MERN</h1>
        <hr />
        <h2>{page === 'login' ? 'Login' : 'Register'}</h2>

        <form onSubmit={handleAuth}>
          {page === 'register' && (
            <div>
              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          )}
          <div>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          {authError && <p style={{ color: 'red' }}>{authError}</p>}
          <button type="submit">{page === 'login' ? 'LOGIN' : 'REGISTER'}</button>
        </form>

        {page === 'login' ? (
          <p>No account? <button onClick={() => { setPage('register'); setAuthError(''); }}>Register</button></p>
        ) : (
          <p>Have an account? <button onClick={() => { setPage('login'); setAuthError(''); }}>Login</button></p>
        )}
      </div>
    );
  }

  // ── Todos page ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>TODO APP MERN</h1>
        <div>
          <span>Hi, {userName}</span>
          <button onClick={logout} style={{ marginLeft: '10px' }}>LOGOUT</button>
        </div>
      </div>
      <hr />

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        placeholder="Enter a task..."
      />
      <button onClick={addTodo}>ADD</button>

      <ul>
        {todos.map((todo) => (
          <li key={todo._id}>
            {editId === todo._id ? (
              <>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(todo._id);
                    if (e.key === 'Escape') { setEditId(null); setEditText(''); }
                  }}
                  autoFocus
                />
                <button onClick={() => saveEdit(todo._id)}>SAVE</button>
                <button onClick={() => { setEditId(null); setEditText(''); }}>CANCEL</button>
              </>
            ) : (
              <>
                <span
                  onClick={() => toggleTodo(todo._id)}
                  style={{ textDecoration: todo.completed ? 'line-through' : 'none', cursor: 'pointer', marginRight: '8px' }}
                >
                  {todo.text}
                </span>
                <button onClick={() => { setEditId(todo._id); setEditText(todo.text); }}>EDIT</button>
                <button onClick={() => deleteTodo(todo._id)}>DELETE</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
