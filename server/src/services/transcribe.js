import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';

const execFileAsync = promisify(execFile);

// =====================
// Config desde .env
// =====================
const STT_PROVIDER = process.env.STT_PROVIDER || 'openai';   // local | openai
const STT_QUALITY  = process.env.STT_QUALITY  || 'standard'; // basic | standard

// =====================
// OpenAI client (si aplica)
// =====================
const openaiClient = STT_PROVIDER === 'openai'
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// =====================
// Mapeos de modelos
// =====================
const LOCAL_MODELS = {
  basic: 'tiny',
  standard: 'small'
};

const OPENAI_MODELS = {
  basic: 'gpt-4o-mini-transcribe',
  standard: 'gpt-4o-transcribe'
};

// =====================
// API pública
// =====================
export async function transcribeAudio(file) {
  if (!file?.buffer) {
    throw new Error('audio buffer no disponible');
  }

  if (STT_PROVIDER === 'local') {
    return await transcribeLocal(file);
  }

  if (STT_PROVIDER === 'openai') {
    return await transcribeOpenAI(file);
  }

  throw new Error(`STT_PROVIDER inválido: ${STT_PROVIDER}`);
}

// =====================
// Implementación LOCAL
// =====================
async function transcribeLocal(file) {
  const tmpDir = path.resolve('tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  const audioPath = path.join(
    tmpDir,
    `audio-${Date.now()}.webm`
  );

  fs.writeFileSync(audioPath, file.buffer);

  try {
    const pythonBin = path.resolve('stt/venv/bin/python');
    const script    = path.resolve('stt/stt_local.py');

    const { stdout } = await execFileAsync(
      pythonBin,
      [script, audioPath],
      { timeout: 120_000 }
    );

    let parsed;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      throw new Error('Salida inválida del STT local');
    }

    if (!parsed.ok) {
      throw new Error(parsed.error || 'Error STT local');
    }

    return parsed.text || '';

  } finally {
    fs.unlink(audioPath, () => {});
  }
}

// =====================
// Implementación OpenAI
// =====================
async function transcribeOpenAI(file) {
  if (!openaiClient) {
    throw new Error('OpenAI client no inicializado');
  }

  const tmpPath = path.join(
    os.tmpdir(),
    `audio-${Date.now()}.webm`
  );

  fs.writeFileSync(tmpPath, file.buffer);

  try {
    const model = OPENAI_MODELS[STT_QUALITY] || OPENAI_MODELS.standard;

    const response = await openaiClient.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model
    });

    return response.text || '';

  } finally {
    fs.unlink(tmpPath, () => {});
  }
}

