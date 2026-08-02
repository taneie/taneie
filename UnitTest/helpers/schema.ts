import assert from "node:assert/strict";

type SafeParseSchema<T> = {
  safeParse: (value: unknown) => { success: boolean; data?: T };
};

export function expectValid<T>(schema: SafeParseSchema<T>, value: unknown) {
  const result = schema.safeParse(value);
  assert.equal(result.success, true, JSON.stringify(result));
  return result.data as T;
}

export function expectInvalid(schema: SafeParseSchema<unknown>, value: unknown) {
  const result = schema.safeParse(value);
  assert.equal(result.success, false, JSON.stringify(result));
}
