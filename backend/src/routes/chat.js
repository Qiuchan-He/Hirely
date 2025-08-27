const express = require("express");
const { chatWithBot } = require("../controllers/chatController");

const router = express.Router();

// Added middleware to log requests
router.use((req, res, next) => {
  console.log(`Chat route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

router.post("/", chatWithBot);

// Route not found handling
router.use((req, res) => {
  res.status(404).json({ error: "Chat endpoint not found" });
});

module.exports = router;
