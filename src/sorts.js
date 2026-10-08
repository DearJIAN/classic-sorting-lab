/**
 * Ten classic sorting algorithms, all ascending and non-mutating.
 * Contract: input is an array of finite safe integers, output is a NEW array.
 * JavaScript numbers outside the safe-integer range are deliberately rejected.
 */
function cloneAndValidate(input) {
  if (!Array.isArray(input)) throw new TypeError('Expected an array of safe integers');
  for (const value of input) {
    if (!Number.isSafeInteger(value)) throw new TypeError('Every value must be a safe integer');
  }
  return input.slice();
}

export function bubbleSort(input) {
  const a = cloneAndValidate(input);
  for (let end = a.length - 1; end > 0; end--) {
    let swapped = false;
    for (let i = 0; i < end; i++) {
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return a;
}

export function selectionSort(input) {
  const a = cloneAndValidate(input);
  for (let i = 0; i < a.length; i++) {
    let minIndex = i;
    for (let j = i + 1; j < a.length; j++) if (a[j] < a[minIndex]) minIndex = j;
    if (minIndex !== i) [a[i], a[minIndex]] = [a[minIndex], a[i]];
  }
  return a;
}

export function insertionSort(input) {
  const a = cloneAndValidate(input);
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
  }
  return a;
}

export function shellSort(input) {
  const a = cloneAndValidate(input);
  for (let gap = Math.floor(a.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
    for (let i = gap; i < a.length; i++) {
      const value = a[i];
      let j = i;
      while (j >= gap && a[j - gap] > value) {
        a[j] = a[j - gap];
        j -= gap;
      }
      a[j] = value;
    }
  }
  return a;
}

export function mergeSort(input) {
  const a = cloneAndValidate(input);
  function sort(left, right) {
    if (right - left <= 1) return;
    const mid = left + Math.floor((right - left) / 2);
    sort(left, mid);
    sort(mid, right);
    const tmp = [];
    let i = left;
    let j = mid;
    while (i < mid && j < right) {
      if (a[i] <= a[j]) tmp.push(a[i++]);
      else tmp.push(a[j++]);
    }
    while (i < mid) tmp.push(a[i++]);
    while (j < right) tmp.push(a[j++]);
    for (let k = 0; k < tmp.length; k++) a[left + k] = tmp[k];
  }
  sort(0, a.length);
  return a;
}

export function quickSort(input) {
  const a = cloneAndValidate(input);
  // Explicit stack and median element pivot avoid recursion depth problems.
  const stack = [[0, a.length - 1]];
  while (stack.length) {
    const [lo, hi] = stack.pop();
    if (lo >= hi) continue;
    const pivot = a[lo + Math.floor((hi - lo) / 2)];
    let i = lo;
    let j = hi;
    while (i <= j) {
      while (a[i] < pivot) i++;
      while (a[j] > pivot) j--;
      if (i <= j) {
        [a[i], a[j]] = [a[j], a[i]];
        i++;
        j--;
      }
    }
    if (lo < j) stack.push([lo, j]);
    if (i < hi) stack.push([i, hi]);
  }
  return a;
}

export function heapSort(input) {
  const a = cloneAndValidate(input);
  function siftDown(start, end) {
    let root = start;
    while (root * 2 + 1 <= end) {
      let child = root * 2 + 1;
      if (child + 1 <= end && a[child] < a[child + 1]) child++;
      if (a[root] >= a[child]) return;
      [a[root], a[child]] = [a[child], a[root]];
      root = child;
    }
  }
  for (let start = Math.floor(a.length / 2) - 1; start >= 0; start--) siftDown(start, a.length - 1);
  for (let end = a.length - 1; end > 0; end--) {
    [a[end], a[0]] = [a[0], a[end]];
    siftDown(0, end - 1);
  }
  return a;
}

export function countingSort(input) {
  const a = cloneAndValidate(input);
  if (a.length < 2) return a;
  const min = Math.min(...a);
  const max = Math.max(...a);
  const range = max - min + 1;
  // Guard against pathological memory use, preserving output correctness.
  if (!Number.isSafeInteger(range) || range > 1_000_000) return mergeSort(a);
  const counts = new Array(range).fill(0);
  for (const value of a) counts[value - min]++;
  let pos = 0;
  for (let i = 0; i < counts.length; i++) {
    while (counts[i]-- > 0) a[pos++] = i + min;
  }
  return a;
}

export function radixSort(input) {
  const a = cloneAndValidate(input);
  function lsd(nonnegative) {
    if (nonnegative.length < 2) return nonnegative;
    const max = Math.max(...nonnegative);
    // Avoid overflowing 10**k at Number.MAX_SAFE_INTEGER.
    for (let exp = 1; exp <= max; exp *= 10) {
      const buckets = Array.from({ length: 10 }, () => []);
      for (const value of nonnegative) {
        buckets[Math.floor(value / exp) % 10].push(value);
      }
      nonnegative = buckets.flat();
      if (exp > Number.MAX_SAFE_INTEGER / 10) break;
    }
    return nonnegative;
  }
  // Sorting magnitudes in descending order puts more negative values first.
  const negatives = lsd(a.filter(v => v < 0).map(v => -v)).reverse().map(v => -v);
  const nonnegatives = lsd(a.filter(v => v >= 0));
  return [...negatives, ...nonnegatives];
}

export function bucketSort(input) {
  const a = cloneAndValidate(input);
  if (a.length < 2) return a;
  const min = Math.min(...a);
  const max = Math.max(...a);
  if (min === max) return a;
  const bucketCount = Math.max(1, Math.ceil(Math.sqrt(a.length)));
  const buckets = Array.from({ length: bucketCount }, () => []);
  // Normalization to a [0, bucketCount) range (works with negative numbers).
  for (const value of a) {
    const normalized = (value - min) / (max - min);
    const index = Math.min(bucketCount - 1, Math.floor(normalized * bucketCount));
    buckets[index].push(value);
  }
  return buckets.flatMap(bucket => insertionSort(bucket));
}

export const algorithms = Object.freeze({
  bubble: { name: '冒泡排序 Bubble Sort', sort: bubbleSort, average: 'O(n²)', space: 'O(1)', stable: true },
  selection: { name: '选择排序 Selection Sort', sort: selectionSort, average: 'O(n²)', space: 'O(1)', stable: false },
  insertion: { name: '插入排序 Insertion Sort', sort: insertionSort, average: 'O(n²)', space: 'O(1)', stable: true },
  shell: { name: '希尔排序 Shell Sort', sort: shellSort, average: '依赖增量序列', space: 'O(1)', stable: false },
  merge: { name: '归并排序 Merge Sort', sort: mergeSort, average: 'O(n log n)', space: 'O(n)', stable: true },
  quick: { name: '快速排序 Quick Sort', sort: quickSort, average: 'O(n log n)', space: 'O(log n) 平均', stable: false },
  heap: { name: '堆排序 Heap Sort', sort: heapSort, average: 'O(n log n)', space: 'O(1)', stable: false },
  counting: { name: '计数排序 Counting Sort', sort: countingSort, average: 'O(n + k)', space: 'O(k)', stable: true },
  radix: { name: '基数排序 Radix Sort', sort: radixSort, average: 'O(d(n + b))', space: 'O(n + b)', stable: true },
  bucket: { name: '桶排序 Bucket Sort', sort: bucketSort, average: '期望 O(n + k)', space: 'O(n + k)', stable: true }
});
