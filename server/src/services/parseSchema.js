import { z } from 'zod';

export const TransferActionSchema = z.object({
  accion: z.literal('transferencia_stock'),
  articulo: z.string().nullable().default(null),
  deposito_origen: z.string().nullable().default(null),
  deposito_destino: z.string().nullable().default(null),
  cantidad: z.number().nullable().default(null),
});

export const ParseResultSchema = z.object({
  acciones: z.array(TransferActionSchema).min(1).max(5),
  confianza: z.number().min(0).max(1).optional(),
});

export function jsonSchemaForParseResult() {
  // Zod -> JSON Schema manual (simple) para este PoC
  return {
    name: 'parse_result',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        acciones: {
          type: 'array',
          minItems: 1,
          maxItems: 5,
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              accion: { type: 'string', enum: ['transferencia_stock'] },
              articulo: { type: ['string', 'null'] },
              deposito_origen: { type: ['string', 'null'] },
              deposito_destino: { type: ['string', 'null'] },
              cantidad: { type: ['number', 'null'] },
            },
            required: ['accion', 'articulo', 'deposito_origen', 'deposito_destino', 'cantidad']
          }
        },
        confianza: { type: 'number', minimum: 0, maximum: 1 }
      },
      required: ['acciones']
    }
  };
}
