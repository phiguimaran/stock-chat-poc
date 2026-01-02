const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// -------- CHAT TEXTO --------
export async function postTexto({
  texto,
  contexto,
  session_id = 'demo',
  user_id = 'demo'
}) {
  const r = await fetch(`${BASE}/api/mensaje`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tipo: 'texto',
      contenido: texto,
      contexto,
      session_id,
      user_id
    })
  });

  return r.json();
}

// -------- CHAT VOZ --------
export async function postAudio({
  blob,
  contexto,
  session_id = 'demo',
  user_id = 'demo'
}) {
  const fd = new FormData();

  fd.append('audio', blob, 'audio.webm');
  fd.append('contexto', contexto);
  fd.append('session_id', session_id);
  fd.append('user_id', user_id);

  const r = await fetch(`${BASE}/api/mensaje/voz`, {
    method: 'POST',
    body: fd
    // ⚠️ NO headers
  });

  return r.json();
}

// -------- CONFIRMACIONES --------
export async function confirmar({
  evento_id,
  accion,
  actor_desde = 'chat',
  actor_id = 'demo'
}) {
  const r = await fetch(`${BASE}/api/mensaje/confirmar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      evento_id,
      accion,
      actor_desde,
      actor_id
    })
  });

  return r.json();
}

// -------- ADMIN --------
export async function adminList({
  estado = '',
  desde = '',
  hasta = '',
  user_id = ''
}) {
  const qs = new URLSearchParams();
  if (estado) qs.set('estado', estado);
  if (desde) qs.set('desde', desde);
  if (hasta) qs.set('hasta', hasta);
  if (user_id) qs.set('user_id', user_id);

  const r = await fetch(`${BASE}/api/admin/eventos?` + qs.toString());
  return r.json();
}

export async function adminAction({
  evento_id,
  accion,
  actor_id = 'admin'
}) {
  const r = await fetch(`${BASE}/api/admin/eventos/${evento_id}/accion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      accion,
      actor_id
    })
  });

  return r.json();
}

