const express = require('express');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

// Create SQLite DB
const db = new Database('users.db');

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT
  )
`);

// TEST ROUTE
app.get('/', (req, res) => {
  res.send('User Service running...');
});

// CREATE USER
app.post('/users', (req, res) => {
  const { name, email } = req.body;

  const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
  const result = stmt.run(name, email);

  res.status(201).json({
    id: result.lastInsertRowid,
    name,
    email
  });
});

// GET ALL USERS
app.get('/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

// START SERVER
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
