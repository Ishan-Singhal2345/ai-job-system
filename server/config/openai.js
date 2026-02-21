/**
 * config/openai.js — OpenAI client initialization
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = openai;
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠ OPENAI_API_KEY missing");
}