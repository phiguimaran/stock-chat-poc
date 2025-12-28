import React, { useEffect, useState } from 'react';
import { adminList, adminAction } from './api.js';

export default function AuditView() {
  const [estado, setEstado] = useState('pendiente_confirmacion');
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);

  async function cargar() {
    setCargando(true);
    const r = await adminList({ estado });
    setItems(r.items || []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, [estado]);

  async function act(evento_id, accion) {
    setCargando(true);
    await adminAction({ evento_id, accion });
    await cargar();
    setCargando(false);
  }

  return (
    <div>
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom: 12 }}>
        <label style={{ display:'flex', gap:8, alignItems:'center' }}>
          Estado
          <select value={estado} onChange={(e)=>setEstado(e.target.value)}>
            <option value="pendiente_confirmacion">pendiente_confirmacion</option>
            <option value="requiere_aclaracion">requiere_aclaracion</option>
            <option value="ejecutado_completo">ejecutado_completo</option>
            <option value="ejecutado_parcial">ejecutado_parcial</option>
            <option value="cancelado">cancelado</option>
            <option value="deshecho">deshecho</option>
          </select>
        </label>
        <button onClick={cargar} disabled={cargando}>Refrescar</button>
        {cargando && <span>Cargando…</span>}
      </div>

      <table width="100%" cellPadding="8" style={{ borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ textAlign:'left', borderBottom:'1px solid #ddd' }}>
            <th>Fecha</th>
            <th>Usuario</th>
            <th>Estado</th>
            <th>Texto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(ev => (
            <tr key={ev._id} style={{ borderBottom:'1px solid #eee', verticalAlign:'top' }}>
              <td>{new Date(ev.createdAt).toLocaleString()}</td>
              <td>{ev.user_id}</td>
              <td>{ev.estado}</td>
              <td style={{ maxWidth: 420 }}>
                {(ev.texto_original || ev.texto_transcripto || '').slice(0, 160)}
              </td>
              <td>
                {ev.estado === 'pendiente_confirmacion' && (
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <button onClick={()=>act(ev._id, 'confirmar')}>Confirmar</button>
                    <button onClick={()=>act(ev._id, 'cancelar')}>Cancelar</button>
                  </div>
                )}
                {['ejecutado_completo','ejecutado_parcial'].includes(ev.estado) && (
                  <button onClick={()=>act(ev._id, 'deshacer')}>Deshacer</button>
                )}
                {['requiere_aclaracion','cancelado','deshecho'].includes(ev.estado) && (
                  <span style={{ opacity: 0.6 }}>—</span>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan="5" style={{ opacity: 0.6 }}>Sin resultados</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
