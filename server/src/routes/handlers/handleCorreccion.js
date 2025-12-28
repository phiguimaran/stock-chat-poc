import { Event } from '../../models/Event.js';
import { validateActions } from '../../services/validateActions.js';
import { addAliasToEntity } from '../../services/lookup.js';

export async function handleCorreccion(req, res, next) {
  try {
    const { evento_id, correcciones, actor_id, actor_desde } = req.body || {};
    if (!evento_id) throw Object.assign(new Error('evento_id requerido'), { statusCode: 400 });
    if (!Array.isArray(correcciones) || correcciones.length === 0) {
      throw Object.assign(new Error('correcciones requeridas'), { statusCode: 400 });
    }

    const ev = await Event.findById(evento_id);
    if (!ev) throw Object.assign(new Error('evento no encontrado'), { statusCode: 404 });

    const interp = ev.interpretaciones.at(-1);
    if (!interp) throw Object.assign(new Error('evento sin interpretación'), { statusCode: 409 });

    // Aplicamos correcciones a acciones (por índice)
    const acciones = interp.acciones.map(a => ({ ...a }));

    for (const c of correcciones) {
      const { index, campo, valor, alias_original } = c || {};
      if (typeof index !== 'number' || index < 0 || index >= acciones.length) continue;
      if (!campo) continue;

      if (['articulo', 'deposito_origen', 'deposito_destino'].includes(campo)) {
        acciones[index][campo] = String(valor);
        // Aprendizaje automático de alias si viene alias_original (lo que escribió el usuario)
        if (alias_original && String(alias_original).trim()) {
          const kind = (campo === 'articulo') ? 'article' : 'deposit';
          await addAliasToEntity({ kind, codigo: String(valor), alias: String(alias_original) });
        }
      } else if (campo === 'cantidad') {
        acciones[index].cantidad = Number(valor);
      }
    }

    const errores = await validateActions(acciones);
    const estado = errores.length ? 'requiere_aclaracion' : 'pendiente_confirmacion';

    ev.estado = estado;
    ev.validacion_ok = errores.length === 0;
    ev.validacion_errores = errores;
    ev.correcciones.push(...correcciones.map(c => ({
      campo: c.campo,
      valor: c.valor,
      aplicado_por: actor_id || 'user',
      aplicado_at: new Date()
    })));

    // Guardamos una "interpretación" nueva con las acciones corregidas (sin llamar LLM)
    ev.interpretaciones.push({
      modelo: interp.modelo,
      texto_usado: interp.texto_usado,
      acciones,
      confianza: interp.confianza ?? null,
      raw: interp.raw
    });

    await ev.save();

    res.json({
      ok: true,
      evento_id: String(ev._id),
      estado: ev.estado,
      interpretacion: ev.interpretaciones.at(-1),
      validacion: { ok: ev.validacion_ok, errores: ev.validacion_errores },
      requiere_confirmacion: ev.estado === 'pendiente_confirmacion'
    });
  } catch (e) {
    next(e);
  }
}
