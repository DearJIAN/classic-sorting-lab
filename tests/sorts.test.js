import test from 'node:test';
import assert from 'node:assert/strict';
import { algorithms } from '../src/sorts.js';

const cases = [
  [], [1], [4, 1], [3, 2, 1], [1, 2, 3, 4, 5],
  [8, 8, 2, 2, 0, 7, 8], [-7, -1, -9, 0, 3, -2],
  [0, 0, 0, 0], [42, -42, 0, 100, -100],
  [Number.MAX_SAFE_INTEGER, 0, Number.MIN_SAFE_INTEGER],
  [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 1, -1],
];
const rand = (seed) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return seed >>> 0; };
const next = rand(20261008);
for (let k = 0; k < 70; k++) {
  const length = next() % 100;
  cases.push(Array.from({ length }, () => (next() % 250) - 125));
}
for (const [key, algo] of Object.entries(algorithms)) {
  test(`${key} sorts ${cases.length} arrays without mutating inputs`, () => {
    for (const input of cases) {
      const frozen = Object.freeze([...input]);
      const expected = [...input].sort((a, b) => a - b);
      assert.deepEqual(algo.sort(frozen), expected, `failed input: ${JSON.stringify(input)}`);
      assert.notStrictEqual(algo.sort(input), input, 'must return a new array');
    }
  });
  test(`${key} rejects invalid numeric values`, () => {
    assert.throws(() => algo.sort([1, NaN]), TypeError);
    assert.throws(() => algo.sort([1, 1.2]), TypeError);
    assert.throws(() => algo.sort([1, Number.POSITIVE_INFINITY]), TypeError);
    assert.throws(() => algo.sort('abc'), TypeError);
  });
}

test('counting sort adapts to a huge key range without allocating giant tables', () => {
  assert.deepEqual(algorithms.counting.sort([-1_000_000_000, 8, 1_000_000_000]), [-1_000_000_000, 8, 1_000_000_000]);
});
