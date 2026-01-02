# CONTINUAR_EN_CHAT_NUEVO (handoff)
Fecha: 2026-01-02

Este documento resume **todo lo acordado y lo implementado**, con comandos exactos, para retomar en un chat nuevo sin perder contexto.

---

## 1) Objetivo del PoC (qué hace y qué NO hace)
### Hace
- Chat web (texto + voz) orientado a **celulares/tablets**.
- Backend interpreta lenguaje natural y propone acciones estructuradas.
- Requiere **confirmación explícita** antes de ejecutar.
- Log auditable de todo (eventos) y ejecución.
- Soporta **múltiples movimientos** en un mismo mensaje (no transaccional: si uno falla, los demás siguen).

### NO hace (por ahora)
- Cálculo de stock / kardex / consolidación.
- Undo desde la interfaz del usuario final (el undo es para backoffice).
- Seguridad completa (auth) (pendiente para etapas posteriores).

---

## 2) Arquitectura actual
### Frontend (React/Vite)
- Ubicación: `client/`
- Vista principal: `client/src/ui/ChatView.jsx`
  - Enviar texto
  - Grabar voz (MediaRecorder)
  - Mostrar JSON de respuesta
  - Botones Confirmar / Cancelar (cuando `requiere_confirmacion`)
- Helper API:
  - `client/src/ui/api.js`

### Backend (Node/Express)
- Ubicación: `server/`
- Entry: `server/src/index.js`
- Rutas: `server/src/routes/api.js`
- Handlers:
  - `server/src/routes/handlers/handleMensaje.js` (texto)
  - `server/src/routes/handlers/handleMensajeVoz.js` (voz multipart)
  - `server/src/routes/handlers/handleConfirmar.js`
- Servicios:
  - `server/src/services/parseMessage.js` (OpenAI parse a JSON Schema)
  - `server/src/services/validateActions.js` (validación vs lookup)
  - `server/src/services/transcribe.js` (STT: local u OpenAI)
  - `server/src/services/lookup.js` (artículos/depósitos/alias)
- Mongo:
  - conexión: `server/src/lib/mongo.js`
  - modelo evento: `server/src/models/Event.js`

---

## 3) Decisiones clave
### Confirmación obligatoria
El LLM se usa como “traductor” y **no ejecuta nada** hasta confirmación.

### Audio se guarda en el log
Se acordó guardar audio (o referencia) para auditar.

### STT: local por CPU, sin GPU
Restricciones:
- uso principal: celulares/tablets
- servidor: **solo CPU, sin GPU** (no negociable)

Problema histórico:
- OpenAI STT desde backend falló con `ECONNRESET` tanto en WSL como en servidor físico.
- Se detectó MTU 1492 (PPPoE):
  `ping -c 3 -M do -s 1472 api.openai.com` -> Frag needed, mtu=1492

Decisión:
- Implementar STT **local** con `faster-whisper` (CPU)
- Dejar switch en `.env` para elegir `local` vs `openai`

---

## 4) Estado actual: qué funciona
- ✅ Backend levanta (Node 20.19.6) en Ubuntu Server 24.04.x
- ✅ MongoDB instalado y corriendo
- ✅ Texto: enviar → parse → validación → `pendiente_confirmacion`
- ✅ Confirmación/cancelación (cuando el evento está en estado correcto)
- ✅ Voz: grabar → subir multipart → transcribir local → parse → validar

Corrección clave:
- `Event.tipo` antes era `['texto','audio']`, se ajustó para aceptar `voz` (o se mapeó correctamente).

---

## 5) Variables de entorno (backend)
Archivo: `server/.env`

Mínimo:
- `PORT`
- `MONGODB_URI`
- `OPENAI_API_KEY`
- `OPENAI_PARSE_MODEL`
- `STT_PROVIDER=local|openai`
- `STT_QUALITY=basic|standard`

Mapeo acordado:
- Local: basic→tiny, standard→small
- OpenAI: basic→gpt-4o-mini-transcribe, standard→gpt-4o-transcribe

---

## 6) Cómo correr el sistema (comandos exactos)

### Backend
```bash
cd /home/adminuser/proyectos/stock-chat-poc/server
npm install
npm run dev
```

Chequeo:
```bash
curl http://localhost:3001/health
```

### Frontend
```bash
cd /home/adminuser/proyectos/stock-chat-poc/client
npm install
npm run dev -- --host
```

---

## 7) Micrófono en el navegador (LAN) – solución recomendada
En algunos escenarios el navegador limita micrófono por IP/LAN.

### ✅ Túnel SSH para que el navegador use localhost
En tu PC (cliente), abrí un túnel hacia el server:

Frontend:
```bash
ssh -L 5173:localhost:5173 adminuser@192.168.1.15
```

Backend:
```bash
ssh -L 3001:localhost:3001 adminuser@192.168.1.15
```

Luego abrir:
- http://localhost:5173

---

## 8) Git: qué versionar y qué no
NO versionar:
- `.env`
- `node_modules/`
- `server/stt/venv/`
- `server/tmp/`
- audios: `*.wav`, `*.webm`

`.gitignore` recomendado:
- `node_modules/`
- `.env`
- `server/stt/venv/`
- `server/tmp/`
- `*.wav`
- `*.webm`

---

## 9) Próximos pasos sugeridos
1) Backoffice mínimo (listar eventos + confirmar/cancelar + undo)
2) Robustez STT local (vacío/timeouts/límites)
3) UX (estados “transcribiendo/interpretando”)
4) Auth/rate-limit

---

## 10) Contexto del server actual
- Ubuntu Server 24.04.x
- Usuario: adminuser
- IP LAN fija: 192.168.1.15
- Repo: /home/adminuser/proyectos/stock-chat-poc
