const express = require('express');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

const db = new Database('orders.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.post('/orders', async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id) {
    return res.status(400).json({ error: 'user_id and product_id are required' });
  }

  try {
    // FIX: fetch only the specific product by ID, not all products
    const productCheck = await fetch(
      `https://product-service-mw02.onrender.com/products/${product_id}`
    );

    if (productCheck.status === 404) {
      return res.status(404).json({ error: `Product with id ${product_id} not found` });
    }

    if (!productCheck.ok) {
      return res.status(502).json({ error: 'Product service error' });
    }

    const product = await productCheck.json();

    const stmt = db.prepare(
      'INSERT INTO orders (user_id, product_id, quantity) VALUES (?, ?, ?)'
    );
    const result = stmt.run(user_id, product_id, quantity || 1);

    res.status(201).json({
      message: 'Order created!',
      orderId: result.lastInsertRowid,
      product,
      quantity: quantity || 1
    });

  } catch (err) {
    res.status(500).json({ error: 'Could not connect to Product Service', detail: err.message });
  }
});

app.get('/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders').all();
  res.json(orders);
});

// NEW: health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'order-service' }));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Order service running on port ${PORT}`));
