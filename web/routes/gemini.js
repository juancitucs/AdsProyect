const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key (for demonstration, hardcoded. In production, use environment variables!)
const API_KEY = "AIzaSyBfSF3k8oEfuo5kly5vR-HCdW3kJq6SnhQ";

const genAI = new GoogleGenerativeAI(API_KEY);

router.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    // Use the model name confirmed by the user's curl command
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();
    res.json({ reply: text });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Error communicating with AI.', details: error.message });
  }
});

module.exports = router;