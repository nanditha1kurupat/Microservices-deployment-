const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();
app.use(cors());

// ROOT CHECK first — before any proxy
app.get("/", (req, res) => res.send("API Gateway is running..."));
app.get("/health", (req, res) => res.json({ status: "ok" }));

// THE FIX: do NOT pass the path as the first arg to app.use()
// Use pathFilter inside the proxy config so Express never strips it
app.use(createProxyMiddleware({
  pathFilter: "/users",
  target: "https://user-services-u4rn.onrender.com",
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      res.status(502).json({ error: "User service unavailable" });
    }
  }
}));

app.use(createProxyMiddleware({
  pathFilter: "/products",
  target: "https://product-service-mw02.onrender.com",
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      res.status(502).json({ error: "Product service unavailable" });
    }
  }
}));

app.use(createProxyMiddleware({
  pathFilter: "/orders",
  target: "https://order-service-119e.onrender.com",
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      res.status(502).json({ error: "Order service unavailable" });
    }
  }
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
