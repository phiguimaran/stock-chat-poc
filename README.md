# stock-chat-poc

PoC de chat (texto y voz) para registrar **movimientos de stock** en lenguaje natural con **confirmación explícita** antes de ejecutar.

## Objetivo
- UI tipo chat para móviles/tablets (también notebooks con micrófono).
- Usuario envía **texto** o **audio**.
- Backend:
  1) transcribe audio (si aplica),
  2) interpreta el mensaje (LLM → acciones estructuradas),
  3) valida contra datos reales (artículos/depósitos),
  4) solicita confirmación,
  5) ejecuta movimientos al confirmar.
- Todo queda logueado en un **evento auditable**. El **undo** está pensado para backoffice (no desde el chat del usuario final).

---

## Stack
- Backend: Node.js + Express + MongoDB (Mongoose)
- Frontend: React + Vite
- LLM (parse NL → acciones): OpenAI (Responses API + JSON Schema)
- STT (voz→texto): **configurable**
  - Local (CPU): `faster-whisper`
  - OpenAI (API): transcribe (cuando se use)

---

## Estructura
- `client/` Frontend (Vite/React)
- `server/` Backend (Express/Mongo)
- `server/stt/` STT local (Python + faster-whisper)
- `server/tmp/` temporales para audio (NO se versiona)

---

## Requisitos
- Node.js **20 LTS**
- MongoDB (servicio local en el servidor)
- Para STT local:
  - Python 3 + venv
  - `faster-whisper` (CPU)

---

## Variables de entorno (backend)
Archivo: `server/.env`

```env
PORT=3001
MONGODB_URI=mongodb://stockchat:stockchat123@127.0.0.1:27017/stock_chat_poc

# LLM parse (texto→acciones)
OPENAI_API_KEY=...
OPENAI_PARSE_MODEL=gpt-4o-mini

# STT (voz→texto)
STT_PROVIDER=local        # local | openai
STT_QUALITY=standard      # basic | standard
```

### STT_PROVIDER / STT_QUALITY
- `STT_PROVIDER=local`
  - `STT_QUALITY=basic`    → Whisper `tiny` (rápido, menor precisión)
  - `STT_QUALITY=standard` → Whisper `small` (mejor balance CPU/calidad)
- `STT_PROVIDER=openai`
  - `STT_QUALITY=basic`    → `gpt-4o-mini-transcribe`
  - `STT_QUALITY=standard` → `gpt-4o-transcribe`

---

## Instalación / ejecución (dev)

### 1) Backend
```bash
cd server
npm install
npm run dev
```

Health check:
```bash
curl http://localhost:3001/health
```

### 2) Frontend
```bash
cd client
npm install
npm run dev -- --host
```

Abrir en navegador:
- http://localhost:5173

> Nota (micrófono): normalmente funciona mejor en `localhost`. Si estás en otra máquina por LAN, podés usar un túnel SSH para que el navegador vea `localhost` (ver guía en CONTINUAR_EN_CHAT_NUEVO.md).

---

## Flujo del sistema
1) Usuario envía texto o audio.
2) Se crea un `Event` en Mongo con:
   - `tipo: texto` o `voz`
   - `texto_original` o `audio_path`/`texto_transcripto`
3) Interpretación (OpenAI parse) → acciones
4) Validación (lookup contra artículos/depósitos)
5) Estado `pendiente_confirmacion`
6) Usuario confirma → ejecución → estados finales:
   - `ejecutado_completo` / `ejecutado_parcial` / `fallo_ejecucion`
   - o `cancelado`

---

## Git / versionado
No versionar:
- `node_modules/`
- `server/stt/venv/`
- `server/tmp/`
- audios de prueba (`*.wav`, `*.webm`)
- `.env`

