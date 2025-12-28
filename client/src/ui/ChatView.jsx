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
    const r = await postTexto({ texto, contexto });
    setUltimo(r);
    setTexto('');
    setCargando(false);
  }

  async function startRec() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setCargando(true);
      const r = await postAudio({ blob, contexto });
      setUltimo(r);
      setCargando(false);
      stream.getTracks().forEach(t => t.stop());
    };
    mr.start();
    mediaRef.current = mr;
    setGrabando(true);
  }

  function stopRec() {
    mediaRef.current?.stop();
    setGrabando(false);
  }

  async function doConfirm(accion) {
    if (!ultimo?.evento_id) return;
    setCargando(true);
    const r = await confirmar({ evento_id: ultimo.evento_id, accion });
    setUltimo({ ...ultimo, post: r });
    setCargando(false);
  }

  // Corrección rápida (MVP): toma la primera sugerencia si existe (para demo).
  async function applyFirstSuggestion(err) {
    const sug = err?.sugerencias?.[0];
    if (!sug) return;
    const campo = err.campo;
    const index = err.index;
    const correcciones = [{
      index,
      campo,
      valor: sug.codigo,
      alias_original: err.valor
    }];
    setCargando(true);
    const r = await corregir({ evento_id: ultimo.evento_id, correcciones });
    setUltimo({ ...ultimo, ...r, evento_id: ultimo.evento_id });
    setCargando(false);
  }

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom: 12 }}>
        <input
          value={texto}
          onChange={(e)=>setTexto(e.target.value)}
          placeholder="Escribí: mover 10 maiz del central al norte"
          style={{ flex:1, padding: 10 }}
        />
        <button onClick={enviarTexto} disabled={cargando}>Enviar</button>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom: 16 }}>
        {!grabando ? (
          <button onClick={startRec} disabled={cargando}>🎙️ Grabar</button>
        ) : (
          <button onClick={stopRec} disabled={cargando}>⏹️ Parar</button>
        )}
        {cargando && <span>Procesando…</span>}
      </div>

      {ultimo && (
        <Card title="Respuesta del sistema">
          <pre style={{ whiteSpace:'pre-wrap' }}>{JSON.stringify(ultimo, null, 2)}</pre>

          {ultimo?.requiere_confirmacion && (
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>doConfirm('confirmar')}>Confirmar</button>
              <button onClick={()=>doConfirm('cancelar')}>Cancelar</button>
            </div>
          )}

          {ultimo?.validacion?.errores?.length ? (
            <div style={{ marginTop: 12 }}>
              <b>Errores</b>
              <ul>
                {ultimo.validacion.errores.map((e, idx) => (
                  <li key={idx}>
                    #{e.index} {e.campo} - {e.tipo} {e.valor ? `(valor: ${e.valor})` : ''}
                    {Array.isArray(e.sugerencias) && e.sugerencias.length > 0 && (
                      <>
                        {' '}| sugerencias: {e.sugerencias.map(s => s.codigo).join(', ')}
                        {' '}
                        <button onClick={()=>applyFirstSuggestion(e)} style={{ marginLeft: 8 }}>
                          Aplicar 1ra sugerencia (demo)
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ border:'1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}
