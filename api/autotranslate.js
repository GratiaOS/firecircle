import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    const { text } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            "Translate this text to the user's native language (auto-detect). Be clear, neutral, and avoid repetition.",
        },
        { role: 'user', content: text },
      ],
    });

    const translatedText = completion.choices[0].message.content;

    res.status(200).json({ translatedText });
  } catch (err) {
    console.error('AutoTranslate API error:', err.message);
    res.status(500).json({ error: 'Auto-translation failed' });
  }
}