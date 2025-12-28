import React, { useMemo, useState } from 'react';
import ChatView from './ChatView.jsx';
import AuditView from './AuditView.jsx';

export default function App() {
  const [modulo, setModulo] = useState('stock');
  const [modo, setModo] = useState('chat'); // chat | audit
  const contexto = useMemo(() => (modulo === 'stock' ? 'stock_movimientos' : 'unknown'), [modulo]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <Header modulo={modulo} setModulo={setModulo} modo={modo} setModo={setModo} />
      {modo === 'chat' ? (
        <ChatView contexto={contexto} />
      ) : (
        <AuditView />
      )}
      <footer style={{ marginTop: 24, opacity: 0.6, fontSize: 12 }}>
        PoC: chat con confirmación + backoffice. (Sin permisos finos aún)
      </footer>
    </div>
  );
}

function Header({ modulo, setModulo, modo, setModo }) {
  return (
    <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom: 16 }}>
      <h2 style={{ margin: 0, flex: 1 }}>Stock Chat PoC</h2>

      <label style={{ display:'flex', gap:8, alignItems:'center' }}>
        Módulo
        <select value={modulo} onChange={(e)=>setModulo(e.target.value)}>
          <option value="stock">Stock</option>
        </select>
      </label>

      <label style={{ display:'flex', gap:8, alignItems:'center' }}>
        Modo
        <select value={modo} onChange={(e)=>setModo(e.target.value)}>
          <option value="chat">Conversacional</option>
          <option value="audit">Control / Auditoría</option>
        </select>
      </label>
    </div>
  );
}
