import OpenAI from 'openai';

export function getOpenAIClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is required');
  return new OpenAI({ apiKey: key });
}
