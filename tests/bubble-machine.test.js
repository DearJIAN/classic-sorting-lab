import test from 'node:test';
import assert from 'node:assert/strict';
import { BubbleMachine } from '../src/bubble-machine.js';
import { bubbleSort } from '../src/sorts.js';

test('one step performs exactly one comparison and only adjacent swaps', () => {
  const machine = new BubbleMachine([3, 1, 2]);
  const step1 = machine.step();
  assert.deepEqual(step1.values, [1, 3, 2]);
  assert.equal(step1.comparisons, 1);
  assert.equal(step1.swaps, 1);
  assert.deepEqual(step1.last, { i: 0, left: 3, right: 1, swapped: true, passFinished: false, earlyExit: false });
  const step2 = machine.step();
  assert.deepEqual(step2.values, [1, 2, 3]);
  assert.equal(step2.pass, 1);
  assert.equal(step2.sortedFrom, 2);
});

test('sorted array exits early after one pass', () => {
  const machine = new BubbleMachine([1, 2, 3, 4, 5]);
  while (!machine.done) machine.step();
  assert.equal(machine.comparisons, 4);
  assert.equal(machine.swaps, 0);
  assert.equal(machine.last.earlyExit, true);
  assert.equal(machine.snapshot().sortedFrom, 0);
});

test('empty and singleton arrays are already finished', () => {
  for (const a of [[], [42]]) {
    const machine = new BubbleMachine(a);
    assert.equal(machine.done, true);
    assert.deepEqual(machine.step().values, a);
    assert.equal(machine.comparisons, 0);
  }
});

test('reset restores the original array and counters', () => {
  const machine = new BubbleMachine([4, 1, 3]);
  machine.step();
  const result = machine.reset([2, 0, -1]);
  assert.equal(result.comparisons, 0);
  assert.equal(result.swaps, 0);
  assert.deepEqual(result.values, [2, 0, -1]);
});

test('frames are immutable snapshots, and algorithm always terminates', () => {
  for (let len = 2; len <= 45; len++) {
    const a = Array.from({ length: len }, (_, i) => (i * 19 + len) % 11 - 5).reverse();
    const machine = new BubbleMachine(a);
    const original = machine.snapshot();
    let steps = 0;
    while (!machine.done) {
      machine.step();
      steps++;
      assert.ok(steps <= len * (len - 1) / 2);
    }
    assert.deepEqual(machine.values, bubbleSort(a));
    assert.deepEqual(original.values, a);
    assert.equal(machine.step().comparisons, steps);
  }
});

test('invalid input is rejected', () => {
  assert.throws(() => new BubbleMachine([1, 1.5]), TypeError);
  assert.throws(() => new BubbleMachine(null), TypeError);
});
