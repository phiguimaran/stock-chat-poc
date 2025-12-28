import { getOpenAIClient } from './openaiClient.js';
import { ParseResultSchema, jsonSchemaForParseResult } from './parseSchema.js';

export async function parseNaturalLanguage({ texto, contexto }) {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_PARSE_MODEL || 'gpt-4o-mini';

  const system = [
    'Sos un traductor de lenguaje natural a acciones estructuradas para movimientos de stock.',
    'Nunca inventes códigos. Si no estás seguro, devolvé null en el campo correspondiente.',
    'Si el usuario pide más de una cosa, devolvé múltiples acciones.',
    'La única acción permitida es transferencia_stock (mover entre depósitos).',
    `Contexto actual: ${contexto}.`,
    'Respondé exclusivamente usando el esquema JSON provisto.',
  ].join(' ');

  const schema = jsonSchemaForParseResult();

  const resp = await client.responses.create({
    model,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: texto },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'parse_stock_actions',
        schema: schema,
      },
    },
  });

  // La API garantiza JSON válido cuando se usa json_schema
  const txt = resp.output_text;
  const parsed = JSON.parse(txt);

  // Validación fuerte del lado servidor
  const validated = ParseResultSchema.parse(parsed);

  return {
    parsed: validated,
    raw: parsed,
    model,
  };
}

