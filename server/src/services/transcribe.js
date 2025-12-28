import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function transcribeAudio(file) {
  if (!file?.buffer) {
    throw new Error('audio buffer no disponible');
  }

  const tmpPath = path.join(
    os.tmpdir(),
    `audio-${Date.now()}.webm`
  );

  fs.writeFileSync(tmpPath, file.buffer);

  try {
    const response = await client.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: 'whisper-1'
    });

    return response.text;
  } finally {
    fs.unlink(tmpPath, () => {});
  }
}

