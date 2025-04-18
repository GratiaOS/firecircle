import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // 🔐 Enable CORS
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { text, sourceLang, targetLang } = req.body;

    const prompt = `Translate this text from ${sourceLang} to ${targetLang}, keeping tone:\n\n"${text}"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const translation = completion.choices[0].message.content;

    res.status(200).json({ translation });
  } catch (err) {
    console.error('Translation API error:', err.message);
    res.status(500).json({ error: 'Translation failed' });
  }
}