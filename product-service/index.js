const express = require('express');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

const db = new Database('products.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT
  )
`);

app.post('/products', (req, res) => {
  const { name, price, description } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'name and price are required' });
  }
  const stmt = db.prepare('INSERT INTO products (name, price, description) VALUES (?, ?, ?)');
  const result = stmt.run(name, price, description);
  res.status(201).json({ message: 'Product created!', productId: result.lastInsertRowid });
});

app.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products').all();
  res.json(products);
});

// NEW: single product by ID — needed by order service
app.get('/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// NEW: health check for keep-alive pings
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'product-service' }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Product service running on port ${PORT}`));
