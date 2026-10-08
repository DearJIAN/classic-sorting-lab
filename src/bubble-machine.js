/** One deterministic, observable transition per adjacent comparison. */
export class BubbleMachine {
  constructor(values) { this.reset(values); }

  reset(values) {
    if (!Array.isArray(values) || !values.every(Number.isSafeInteger)) {
      throw new TypeError('BubbleMachine expects an array of safe integers');
    }
    this.initial = [...values];
    this.values = [...values];
    this.pass = 0;
    this.index = 0;
    this.comparisons = 0;
    this.swaps = 0;
    this.swappedThisPass = false;
    this.done = values.length < 2;
    this.last = null;
    return this.snapshot();
  }

  snapshot() {
    return {
      values: [...this.values],
      pass: this.pass,
      index: this.index,
      comparisons: this.comparisons,
      swaps: this.swaps,
      done: this.done,
      sortedFrom: this.done ? 0 : this.values.length - this.pass,
      last: this.last ? { ...this.last } : null
    };
  }

  step() {
    if (this.done) return this.snapshot();
    const i = this.index;
    const left = this.values[i];
    const right = this.values[i + 1];
    const swapped = left > right;
    if (swapped) {
      [this.values[i], this.values[i + 1]] = [right, left];
      this.swaps++;
      this.swappedThisPass = true;
    }
    this.comparisons++;
    this.index++;
    let passFinished = false;
    let earlyExit = false;
    if (this.index >= this.values.length - 1 - this.pass) {
      passFinished = true;
      this.pass++;
      this.index = 0;
      if (!this.swappedThisPass) {
        this.done = true;
        earlyExit = true;
      } else if (this.pass >= this.values.length - 1) {
        this.done = true;
      }
      this.swappedThisPass = false;
    }
    this.last = { i, left, right, swapped, passFinished, earlyExit };
    return this.snapshot();
  }
}
