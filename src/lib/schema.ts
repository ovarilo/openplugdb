import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

/**
 * Compiles a schema from schemas/. Strict mode is on, except strictRequired:
 * the schemas use `required` inside `not` to forbid not-applicable keys.
 */
export function compileSchema(root: string, name: string): ValidateFunction {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictRequired: false,
    allowUnionTypes: true,
  });
  addFormats(ajv);
  return ajv.compile(JSON.parse(readFileSync(join(root, 'schemas', name), 'utf8')) as object);
}
