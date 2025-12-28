import React, { useRef, useState } from 'react';
import { postTexto, postAudio, confirmar, corregir } from './api.js';

export default function ChatView({ contexto }) {
  const [texto, setTexto] = useState('');
  const [ultimo, setUltimo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [grabando, setGrabando] = useState(false);

  const mediaRef = useRef(null);
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

  async function iniciarGrabacion() {
    if (grabando) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    chunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const form = new FormData();
      form.append('audio', blob, 'audio.webm');
      form.append('contexto', contexto);
      form.append('session_id', 'web');
      form.append('user_id', 'web');

      setCargando(true);
      try {
        const r = await postAudio(form);
        setUltimo(r);
      } finally {
        setCargando(false);
      }
    };

    mediaRef.current = mediaRecorder;
    mediaRecorder.start();
    setGrabando(true);
  }

  function detenerGrabacion() {
    if (!grabando || !mediaRef.current) return;
    mediaRef.current.stop();
    mediaRef.current.stream.getTracks().forEach(t => t.stop());
    setGrabando(false);
  }

  async function confirmarUltimo() {
    if (!ultimo?.evento_id) return;
    setCargando(true);
    try {
      const r = await confirmar(ultimo.evento_id);
      setUltimo(r);
    } finally {
      setCargando(false);
    }
  }

  async function corregirUltimo() {
    if (!ultimo?.evento_id) return;
    setCargando(true);
    try {
      const r = await corregir(ultimo.evento_id);
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
          placeholder="Escribí o usá el micrófono…"
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={enviarTexto} disabled={cargando}>
            Enviar
          </button>
        <button
  onClick={grabando ? detenerGrabacion : iniciarGrabacion}
  disabled={cargando}
>
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
              <button onClick={confirmarUltimo} disabled={cargando}>
                Confirmar
              </button>
              <button onClick={corregirUltimo} disabled={cargando}>
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

