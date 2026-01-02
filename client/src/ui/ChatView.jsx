import React, { useRef, useState } from 'react';
import { postTexto, postAudio, confirmar } from './api.js';

export default function ChatView({ contexto }) {
  const [texto, setTexto] = useState('');
  const [ultimo, setUltimo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [grabando, setGrabando] = useState(false);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  async function enviarTexto() {
    if (!texto.trim()) return;
    setCargando(true);
    try {
      const r = await postTexto({ texto, contexto });
      setUltimo(r);
      setTexto('');
    } finally {
      setCargando(false);
    }
  }

  async function toggleGrabacion() {
    if (!grabando) {
      // START
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (chunksRef.current.length === 0) {
          console.warn('No se capturó audio');
          stream.getTracks().forEach(t => t.stop());
          setGrabando(false);
          return;
        }

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        });

        setCargando(true);
        try {
          const r = await postAudio({ blob, contexto });
          setUltimo(r);
        } finally {
          setCargando(false);
        }

        stream.getTracks().forEach(t => t.stop());
        recorderRef.current = null;
        streamRef.current = null;
      };

      recorder.start(250); // 🔑 forzar dataavailable cada 250ms
      recorderRef.current = recorder;
      streamRef.current = stream;
      setGrabando(true);
    } else {
      // STOP
      recorderRef.current?.stop();
      setGrabando(false);
    }
  }

  async function confirmarUltimo(accion) {
    if (!ultimo?.evento_id) return;
    setCargando(true);
    try {
      const r = await confirmar({
        evento_id: ultimo.evento_id,
        accion
      });
      setUltimo(r);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card title="Mensaje">
        <textarea
          rows={3}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Escribí o grabá un mensaje…"
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={enviarTexto} disabled={cargando}>
            Enviar texto
          </button>

          <button onClick={toggleGrabacion} disabled={cargando}>
            {grabando ? '⏹ Detener grabación' : '🎤 Grabar voz'}
          </button>
        </div>
      </Card>

      {ultimo && (
        <Card title="Sistema">
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(ultimo, null, 2)}
          </pre>

          {ultimo.requiere_confirmacion && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => confirmarUltimo('confirmar')}>
                Confirmar
              </button>
              <button onClick={() => confirmarUltimo('cancelar')}>
                Cancelar
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

