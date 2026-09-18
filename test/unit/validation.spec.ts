import { describe, expect, it } from 'vitest';
import { readIntParam } from '../../server/utils/validation';

describe('readIntParam', () => {
  it.each([
    ['precision-losing integer', '9007199254740993'],
    ['overflowing integer', `1${'0'.repeat(309)}`],
  ])('rejects a %s with a bad request', (_label, value) => {
    let thrown: unknown;

    try {
      readIntParam(value);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ statusCode: 400 });
  });

  it('accepts the maximum safe integer boundary', () => {
    expect(readIntParam(String(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('uses the fallback when the parameter is omitted', () => {
    expect(readIntParam(undefined, { fallback: 1 })).toBe(1);
  });
});
