import { getOpenAIClient } from './openaiClient.js';
import { ParseResultSchema, jsonSchemaForParseResult } from './parseSchema.js';

export async function parseNaturalLanguage({ texto, contexto }) {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_PARSE_MODEL || 'gpt-4o-mini';

  const system = [
    'Sos un traductor de lenguaje natural a acciones estructuradas para movimientos de stock.',
    'Nunca inventes códigos. Si no estás seguro, devolvé null en el campo correspondiente.',
    'Si el usuario pide mas de una cosa, devolvé múltiples acciones.',
    'La única acción permitida es transferencia_stock (mover entre depósitos).',
    `Contexto actual: ${contexto}.`,
    'Salida estricta en el esquema JSON indicado.'
  ].join(' ');

  // Usamos Responses API con salida estructurada (JSON Schema).
  const schema = jsonSchemaForParseResult();

  const resp = await client.responses.create({
    model,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: texto }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: schema
    }
  });

  // Extraer JSON resultante (SDK: output_text o output[...])
  const txt = resp.output_text;
  const parsed = JSON.parse(txt);
  const validated = ParseResultSchema.parse(parsed);

  return { parsed: validated, raw: parsed, model };
}
