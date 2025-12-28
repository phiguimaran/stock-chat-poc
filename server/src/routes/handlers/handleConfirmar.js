import { Event } from '../../models/Event.js';
import { Movement } from '../../models/Movement.js';

export async function handleConfirmar(req, res, next) {
  try {
    const { evento_id, accion, actor_id, actor_desde } = req.body || {};
    if (!evento_id) throw Object.assign(new Error('evento_id requerido'), { statusCode: 400 });
    if (!accion || !['confirmar', 'cancelar'].includes(accion)) {
      throw Object.assign(new Error('accion inválida'), { statusCode: 400 });
    }

    const ev = await Event.findById(evento_id);
    if (!ev) throw Object.assign(new Error('evento no encontrado'), { statusCode: 404 });

    if (accion === 'cancelar') {
      if (['cancelado', 'ejecutado_completo', 'ejecutado_parcial', 'deshecho'].includes(ev.estado)) {
        return res.json({ ok: true, evento_id: String(ev._id), estado: ev.estado });
      }
      ev.estado = 'cancelado';
      ev.cancelado_por = actor_id || ev.user_id || 'anon';
      ev.cancelado_desde = actor_desde || 'chat';
      ev.cancelado_at = new Date();
      await ev.save();
      return res.json({ ok: true, evento_id: String(ev._id), estado: ev.estado });
    }

    // confirmar
    if (['ejecutado_completo', 'ejecutado_parcial'].includes(ev.estado)) {
      return res.json({ ok: true, evento_id: String(ev._id), estado: ev.estado, movimientos: ev.movimientos_ejecutados });
    }

    if (ev.estado !== 'pendiente_confirmacion') {
      throw Object.assign(new Error(`evento no confirmable en estado ${ev.estado}`), { statusCode: 409 });
    }
    if (!ev.validacion_ok) {
      throw Object.assign(new Error('evento no válido para confirmar'), { statusCode: 409 });
    }

    const interp = ev.interpretaciones.at(-1);
    const acciones = (interp?.acciones || []);
    const ejecutados = [];
    const fallidos = [];

    for (let i = 0; i < acciones.length; i++) {
      const a = acciones[i];
      try {
        const mov = await Movement.create({
          articulo_codigo: a.articulo,
          deposito_origen_codigo: a.deposito_origen,
          deposito_destino_codigo: a.deposito_destino,
          cantidad: a.cantidad,
          timestamp: new Date(),
          evento_id: ev._id
        });
        ejecutados.push(mov._id);
      } catch (err) {
        fallidos.push({ index: i, error: err.message || 'error' });
      }
    }

    ev.movimientos_ejecutados = ejecutados;
    ev.movimientos_fallidos = fallidos;
    ev.confirmado_por = actor_id || ev.user_id || 'anon';
    ev.confirmado_desde = actor_desde || 'chat';
    ev.confirmado_at = new Date();

    if (fallidos.length === 0) ev.estado = 'ejecutado_completo';
    else if (ejecutados.length > 0) ev.estado = 'ejecutado_parcial';
    else ev.estado = 'fallo_ejecucion';

    await ev.save();

    return res.json({
      ok: true,
      evento_id: String(ev._id),
      estado: ev.estado,
      movimientos_ejecutados: ejecutados.map(String),
      movimientos_fallidos: fallidos
    });

  } catch (e) {
    next(e);
  }
}
