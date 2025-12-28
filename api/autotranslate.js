import { OpenAI } from 'openai';

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 15000);
const OPENAI_MAX_RETRIES = Number(process.env.OPENAI_MAX_RETRIES || 2);
const MAX_TEXT_CHARS = Number(process.env.TRANSLATE_MAX_CHARS || 1200);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: OPENAI_BASE_URL,
  timeout: OPENAI_TIMEOUT_MS,
  maxRetries: OPENAI_MAX_RETRIES,
});

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const list = (process.env.CORS_ALLOW_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (list.length === 0 && process.env.NODE_ENV !== 'production') {
    return (
      origin === 'http://localhost:5173' ||
      origin === 'http://127.0.0.1:5173'
    );
  }
  if (list.includes('*')) return true;
  if (list.includes(origin)) return true;
  const regexRaw = process.env.CORS_ALLOW_ORIGIN_REGEX;
  if (regexRaw) {
    try {
      const regex = new RegExp(regexRaw);
      return regex.test(origin);
    } catch {
      return false;
    }
  }
  return false;
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  const corsOk = applyCors(req, res);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return corsOk ? res.status(200).end() : res.status(403).end();
  }

  try {
    if (!corsOk) {
      return res.status(403).json({ error: 'CORS_NOT_ALLOWED' });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY_MISSING' });
    }

    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'EMPTY_TEXT' });
    }
    if (text.length > MAX_TEXT_CHARS) {
      return res.status(400).json({ error: 'TEXT_TOO_LONG' });
    }

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            "Translate this text to the user's native language (auto-detect). Be clear, neutral, and avoid repetition.",
        },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
    });

    const translatedText = completion.choices?.[0]?.message?.content?.trim();
    if (!translatedText) {
      return res.status(502).json({ error: 'NO_TRANSLATION' });
    }
    res.status(200).json({ translatedText });
  } catch (err) {
    console.error('AutoTranslate API error:', err.message);
    res.status(500).json({ error: 'Auto-translation failed' });
  }
}
