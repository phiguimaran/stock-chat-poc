import mongoose from 'mongoose';

const ActionSchema = new mongoose.Schema({
  accion: { type: String, required: true }, // transferencia_stock
  articulo: { type: String, default: null }, // codigo sugerido/normalizado
  deposito_origen: { type: String, default: null },
  deposito_destino: { type: String, default: null },
  cantidad: { type: Number, default: null },
}, { _id: false });

const ValidationErrorSchema = new mongoose.Schema({
  index: { type: Number, required: true }, // indice en acciones[]
  campo: { type: String, required: true },
  tipo: { type: String, required: true }, // no_existe, invalido, ...
  valor: { type: String, default: null },
  sugerencias: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { _id: false });

const InterpretationSchema = new mongoose.Schema({
  modelo: { type: String, required: true },
  texto_usado: { type: String, required: true },
  acciones: { type: [ActionSchema], default: [] },
  confianza: { type: Number, default: null },
  raw: { type: mongoose.Schema.Types.Mixed, default: null },
  created_at: { type: Date, default: () => new Date() },
}, { _id: false });

const CorrectionSchema = new mongoose.Schema({
  campo: { type: String, required: true },
  valor: { type: mongoose.Schema.Types.Mixed, required: true },
  aplicado_por: { type: String, default: 'system' },
  aplicado_at: { type: Date, default: () => new Date() },
}, { _id: false });

const EventSchema = new mongoose.Schema({
  // Identidad y contexto
  user_id: { type: String, default: 'anon' },
  session_id: { type: String, default: null },
  contexto: { type: String, default: 'stock_movimientos' },

  // Input
  tipo: {
    type: String,
    enum: ['texto', 'voz'],
    required: true
  },
  texto_original: { type: String, default: null },
  audio_path: { type: String, default: null },
  texto_transcripto: { type: String, default: null },

  // Estado
  estado: {
    type: String,
    enum: [
      'recibido',
      'interpretado',
      'requiere_aclaracion',
      'pendiente_confirmacion',
      'ejecutado_completo',
      'ejecutado_parcial',
      'cancelado',
      'deshecho',
      'fallo_ejecucion'
    ],
    default: 'recibido',
    index: true
  },

  // Interpretaciones
  interpretaciones: { type: [InterpretationSchema], default: [] },

  // Validación
  validacion_ok: { type: Boolean, default: false },
  validacion_errores: { type: [ValidationErrorSchema], default: [] },

  // Correcciones
  correcciones: { type: [CorrectionSchema], default: [] },

  // Ejecución
  movimientos_ejecutados: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Movement',
    default: []
  },
  movimientos_fallidos: { type: [mongoose.Schema.Types.Mixed], default: [] },

  confirmado_por: { type: String, default: null },
  confirmado_desde: { type: String, enum: ['chat', 'backoffice'], default: null },
  confirmado_at: { type: Date, default: null },

  cancelado_por: { type: String, default: null },
  cancelado_desde: { type: String, enum: ['chat', 'backoffice'], default: null },
  cancelado_at: { type: Date, default: null },

  deshecho_por: { type: String, default: null },
  deshecho_desde: { type: String, enum: ['backoffice'], default: null },
  deshecho_at: { type: Date, default: null },

}, { timestamps: true });

export const Event = mongoose.model('Event', EventSchema);

