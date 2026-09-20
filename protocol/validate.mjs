/** Minimal JSON-Schema-subset validator — zero dependencies, on purpose.
 *
 * midden ships no runtime deps and the test runner is bare `node --test`, so
 * the room-state schema is enforced by this small recursive checker rather
 * than ajv. Supported vocabulary (everything room-state.schema.json uses):
 *   type (string|array of strings), required, properties, items,
 *   additionalProperties:false, const, enum, minItems, maxItems,
 *   minimum, maximum, minLength, pattern, integer:true.
 *
 * `validate(schema, value)` → `{ valid, errors: string[] }` with JSON-pointer
 * paths, so test failures read like real validator output.
 */

const TYPE_CHECKS = {
  object: (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
  array: Array.isArray,
  string: (v) => typeof v === 'string',
  number: (v) => typeof v === 'number' && Number.isFinite(v),
  boolean: (v) => typeof v === 'boolean',
  null: (v) => v === null,
};

function typeName(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function check(schema, value, path, errors) {
  if (!schema || typeof schema !== 'object') return;

  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${path}: expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}`);
  }

  if (schema.enum && !schema.enum.some((e) => e === value)) {
    errors.push(`${path}: value ${JSON.stringify(value)} not in enum`);
  }

  let types = schema.type ? (Array.isArray(schema.type) ? schema.type : [schema.type]) : null;
  if (types && !types.some((t) => (TYPE_CHECKS[t] || (() => false))(value))) {
    errors.push(`${path}: expected type ${types.join('|')}, got ${typeName(value)}`);
    return; // further keyword checks would mislead
  }
  if (schema.integer === true && typeof value === 'number' && !Number.isInteger(value)) {
    errors.push(`${path}: expected integer, got ${value}`);
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path}: string shorter than minLength ${schema.minLength}`);
    }
    if (schema.pattern !== undefined && !(new RegExp(schema.pattern)).test(value)) {
      errors.push(`${path}: string does not match pattern ${schema.pattern}`);
    }
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path}: ${value} < minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path}: ${value} > maximum ${schema.maximum}`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path}: ${value.length} items < minItems ${schema.minItems}`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${path}: ${value.length} items > maxItems ${schema.maxItems}`);
    }
    if (schema.items) value.forEach((item, i) => check(schema.items, item, `${path}/${i}`, errors));
  }

  if (TYPE_CHECKS.object(value)) {
    const req = schema.required || [];
    for (const key of req) {
      if (!(key in value)) errors.push(`${path}: missing required property "${key}"`);
    }
    const props = schema.properties || {};
    for (const [key, sub] of Object.entries(props)) {
      if (key in value) check(sub, value[key], `${path}/${key}`, errors);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in props)) errors.push(`${path}: additional property "${key}" not allowed`);
      }
    }
  }
}

export function validate(schema, value) {
  const errors = [];
  check(schema, value, '', errors);
  return { valid: errors.length === 0, errors };
}
