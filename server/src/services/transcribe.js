import fs from 'node:fs';
import { getOpenAIClient } from './openaiClient.js';

export async function transcribeAudio({ filePath }) {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe';
  const file = fs.createReadStream(filePath);

  const transcription = await client.audio.transcriptions.create({
    model,
    file,
    response_format: 'text'
  });

  // SDK devuelve .text cuando response_format es text
  return (transcription.text ?? transcription).toString().trim();
}
