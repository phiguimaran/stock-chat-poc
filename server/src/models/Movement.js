import mongoose from 'mongoose';

const MovementSchema = new mongoose.Schema({
  articulo_codigo: { type: String, required: true, index: true },
  deposito_origen_codigo: { type: String, required: true, index: true },
  deposito_destino_codigo: { type: String, required: true, index: true },
  cantidad: { type: Number, required: true },
  timestamp: { type: Date, required: true, default: () => new Date() },

  // Para trazabilidad
  evento_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', index: true },
  movimiento_inverso_de: { type: mongoose.Schema.Types.ObjectId, ref: 'Movement', default: null },
}, { timestamps: true });

export const Movement = mongoose.model('Movement', MovementSchema);
