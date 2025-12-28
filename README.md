# Stock Chat PoC (Node.js + React + MongoDB + OpenAI)

PoC de app conversacional (texto/voz) para generar movimientos de stock **solo con confirmación explícita**.
Incluye una vista de **Control/Auditoría** para ver pendientes, confirmar/cancelar y hacer **undo**.

## Componentes
- `server/` API Node.js (Express) + MongoDB (Mongoose)
- `client/` React (Vite) con 2 modos:
  - Conversacional (solo enviar / confirmar / cancelar)
  - Control/Auditoría (lista filtrable + confirmar/cancelar/undo)

## Requisitos
- Node.js 18+ (recomendado 20+)
- MongoDB (local o remoto)
- Una API key de OpenAI

## Configuración rápida

### 1) Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Variables en `.env`:
- `OPENAI_API_KEY` (obligatoria)
- `MONGODB_URI` (ej: `mongodb://127.0.0.1:27017/stock_chat_poc`)
- `PORT` (por defecto 3001)
- `UPLOAD_DIR` (por defecto `./uploads`)
- `OPENAI_TRANSCRIBE_MODEL` (por defecto `gpt-4o-mini-transcribe`)
- `OPENAI_PARSE_MODEL` (por defecto `gpt-4o-mini`)

### 2) Seed (artículos y depósitos de ejemplo)
En otra terminal:
```bash
cd server
npm run seed
```

### 3) Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

El frontend apunta al backend con:
- `VITE_API_BASE_URL` (por defecto `http://localhost:3001`)

## Flujo (resumen)
1) Usuario envía texto o audio
2) Backend:
   - si audio: transcribe con OpenAI (STT)
   - interpreta con OpenAI (LLM) -> **acciones[]** estructuradas
   - valida contra BD (existencia + reglas)
   - devuelve propuesta + errores/sugerencias
3) Usuario final solo puede confirmar/cancelar
4) Vista Control/Auditoría puede:
   - confirmar/cancelar pendientes
   - deshacer ejecutados (compensación)

## Notas de OpenAI
- Transcripción: endpoint `audio.transcriptions.create` (modelos tipo `gpt-4o-mini-transcribe`). Ver guía oficial. 
- Salidas estructuradas: se usa JSON Schema (vía Zod). Ver guía oficial de Structured Outputs.

(Referencias oficiales: OpenAI STT y Structured Outputs) 
