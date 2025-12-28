import { Event } from '../../models/Event.js';
import { Movement } from '../../models/Movement.js';

export async function handleAdminAction(req, res, next) {
  try {
    const { evento_id, accion, actor_id } = req.body || {};
    if (!evento_id) throw Object.assign(new Error('evento_id requerido'), { statusCode: 400 });
    if (!accion || !['confirmar', 'cancelar', 'deshacer'].includes(accion)) {
      throw Object.assign(new Error('accion inválida'), { statusCode: 400 });
    }

    const ev = await Event.findById(evento_id);
    if (!ev) throw Object.assign(new Error('evento no encontrado'), { statusCode: 404 });

    if (accion === 'confirmar' || accion === 'cancelar') {
      // Reutilizamos el endpoint de confirmar lógico: devolvemos un instructivo al cliente.
      // Para el PoC, ejecutamos aquí directamente para simplificar.
      // (En producción, compartir lógica en un servicio común.)
      if (accion === 'cancelar') {
        if (['cancelado', 'deshecho'].includes(ev.estado)) return res.json({ ok: true, evento_id: String(ev._id), estado: ev.estado });
        ev.estado = 'cancelado';
        ev.cancelado_por = actor_id || 'admin';
        ev.cancelado_desde = 'backoffice';
        ev.cancelado_at = new Date();
        await ev.save();
        return res.json({ ok: true, evento_id: String(ev._id), estado: ev.estado });
      }

      // confirmar
      if (['ejecutado_completo', 'ejecutado_parcial'].includes(ev.estado)) {
        return res.json({ ok: true, evento_id: String(ev._id), estado: ev.estado });
      }
      if (ev.estado !== 'pendiente_confirmacion' || !ev.validacion_ok) {
        throw Object.assign(new Error('evento no confirmable'), { statusCode: 409 });
      }

      const interp = ev.interpretaciones.at(-1);
      const acciones = interp?.acciones || [];
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
      ev.confirmado_por = actor_id || 'admin';
      ev.confirmado_desde = 'backoffice';
      ev.confirmado_at = new Date();
      ev.estado = (fallidos.length === 0) ? 'ejecutado_completo' : (ejecutados.length ? 'ejecutado_parcial' : 'fallo_ejecucion');
      await ev.save();

      return res.json({ ok: true, evento_id: String(ev._id), estado: ev.estado });
    }

    // deshacer
    if (!['ejecutado_completo', 'ejecutado_parcial'].includes(ev.estado)) {
      throw Object.assign(new Error('solo se puede deshacer un evento ejecutado'), { statusCode: 409 });
    }

    const movimientosIds = ev.movimientos_ejecutados || [];
    const movimientos = await Movement.find({ _id: { $in: movimientosIds } }).lean();

    const inversos = [];
    for (const m of movimientos) {
      const inv = await Movement.create({
        articulo_codigo: m.articulo_codigo,
        deposito_origen_codigo: m.deposito_destino_codigo,
        deposito_destino_codigo: m.deposito_origen_codigo,
        cantidad: m.cantidad,
        timestamp: new Date(),
        evento_id: ev._id,
        movimiento_inverso_de: m._id
      });
      inversos.push(inv._id);
    }

    ev.estado = 'deshecho';
    ev.deshecho_por = actor_id || 'admin';
    ev.deshecho_desde = 'backoffice';
    ev.deshecho_at = new Date();
    await ev.save();

    return res.json({ ok: true, evento_id: String(ev._id), estado: ev.estado, movimientos_inversos: inversos.map(String) });

  } catch (e) {
    next(e);
  }
}
