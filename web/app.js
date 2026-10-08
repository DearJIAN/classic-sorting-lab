import { BubbleMachine } from '../src/bubble-machine.js';

const $ = id => document.getElementById(id);
const ui = {
  bars: $('bars'), statusText: $('statusText'), statusBadge: $('statusBadge'),
  arraySummary: $('arraySummary'), progressText: $('progressText'),
  progressBar: $('progressBar'), progressFill: $('progressFill'),
  playBtn: $('playBtn'), playText: $('playText'), pauseBtn: $('pauseBtn'),
  stepBtn: $('stepBtn'), resetBtn: $('resetBtn'), shuffleBtn: $('shuffleBtn'),
  activity: $('activity'), compStat: $('compStat'), swapStat: $('swapStat'),
  passStat: $('passStat'), sizeStat: $('sizeStat'), sizeRange: $('sizeRange'),
  speedRange: $('speedRange'), sizeOutput: $('sizeOutput'), speedOutput: $('speedOutput'),
  preset: $('preset'), customInput: $('customInput'), applyBtn: $('applyBtn'),
  inputMessage: $('inputMessage')
};

const randomInt = (from, to) => Math.floor(Math.random() * (to - from + 1)) + from;
function generate(length, type) {
  const values = Array.from({ length }, () => randomInt(9, 98));
  if (type === 'sorted' || type === 'nearly' || type === 'reverse') {
    values.sort((a, b) => a - b);
  }
  if (type === 'reverse') values.reverse();
  if (type === 'nearly' && values.length >= 4) {
    const i = randomInt(0, values.length - 2);
    const j = randomInt(i + 1, values.length - 1);
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

let initial = generate(22, 'random');
let machine = new BubbleMachine(initial);
let isRunning = false;
let timer = null;
let isPaused = false;
const maxComparisons = n => n * (n - 1) / 2;
const delay = () => Math.round(1030 / Math.pow(1.95, Number(ui.speedRange.value) - 1));

function stop(pause = false) {
  isRunning = false;
  clearTimeout(timer);
  timer = null;
  isPaused = pause && machine.comparisons > 0 && !machine.done;
}

function setup(values) {
  stop();
  initial = [...values];
  machine.reset(initial);
  ui.sizeRange.value = String(Math.min(48, Math.max(2, initial.length)));
  ui.sizeOutput.textContent = initial.length.toString();
  ui.inputMessage.classList.remove('error');
  ui.inputMessage.textContent = '填入数字后点击「应用自定义数组」，支持负数和重复值（2–48 项）。';
  render();
}

function render() {
  const snap = machine.snapshot();
  const n = snap.values.length;
  const min = Math.min(...snap.values);
  const max = Math.max(...snap.values);
  const spread = max - min || 1;
  const last = snap.last;
  const fragment = document.createDocumentFragment();
  snap.values.forEach((value, i) => {
    const bar = document.createElement('div');
    const height = 12 + ((value - min) / spread) * 76;
    bar.className = 'bar';
    bar.style.height = `${height}%`;
    const comparing = !snap.done && last && (i === last.i || i === last.i + 1);
    if (snap.done || i >= snap.sortedFrom) bar.classList.add('sorted');
    else if (comparing) bar.classList.add('comparing');
    if (n <= 24) {
      const label = document.createElement('span');
      label.className = 'bar-value';
      label.textContent = String(value);
      bar.appendChild(label);
    }
    bar.title = `下标 ${i}：${value}${snap.done || i >= snap.sortedFrom ? '（已排序）' : comparing ? '（正在比较）' : ''}`;
    fragment.appendChild(bar);
  });
  ui.bars.replaceChildren(fragment);
  ui.bars.setAttribute('aria-label', `当前数组：${snap.values.join('，')}。比较 ${snap.comparisons} 次，交换 ${snap.swaps} 次`);
  ui.arraySummary.textContent = `${n} ELEMENT${n === 1 ? '' : 'S'}`;
  ui.compStat.textContent = String(snap.comparisons);
  ui.swapStat.textContent = String(snap.swaps);
  ui.passStat.textContent = String(snap.pass);
  ui.sizeStat.textContent = String(n);
  const progress = snap.done ? 100 : Math.round((snap.comparisons / (maxComparisons(n) || 1)) * 100);
  ui.progressFill.style.width = `${progress}%`;
  ui.progressText.textContent = `${progress}%`;
  ui.progressBar.setAttribute('aria-valuenow', String(progress));

  ui.statusBadge.className = 'status-badge' + (snap.done ? ' complete' : isRunning ? ' running' : isPaused ? ' paused' : '');
  ui.statusText.textContent = snap.done ? '排序完成' : isRunning ? '正在排序' : isPaused ? '已暂停' : '准备就绪';
  ui.playText.textContent = snap.done ? '再来一次' : isPaused ? '继续排序' : '开始排序';
  ui.pauseBtn.disabled = !isRunning;
  ui.stepBtn.disabled = snap.done;

  if (snap.done) {
    ui.activity.textContent = last?.earlyExit
      ? `提前结束！这一轮没有发生交换。共 ${snap.comparisons} 次比较、${snap.swaps} 次交换。`
      : `排序完成！${n} 个数字已升序排列，累计 ${snap.comparisons} 次比较、${snap.swaps} 次交换。`;
  } else if (last) {
    const action = last.swapped ? '左边更大，已交换位置' : '顺序正确，无需交换';
    ui.activity.textContent = `比较 ${last.left} 与 ${last.right}：${action}。${last.passFinished ? ' 本轮结束。' : ''}`;
  } else {
    ui.activity.textContent = '等待开始 — 点击“开始排序”，看看数字如何找到自己的位置。';
  }
  document.querySelectorAll('.code-line').forEach(line => line.classList.remove('active'));
  if (snap.done) document.querySelector('[data-line="7"]').classList.add('active');
  else if (last) document.querySelector(`[data-line="${last.swapped ? '5' : '4'}"]`).classList.add('active');
}

function tick() {
  if (!isRunning) return;
  machine.step();
  if (machine.done) stop();
  render();
  if (isRunning) timer = setTimeout(tick, delay());
}
function play() {
  if (isRunning) return;
  if (machine.done) machine.reset(initial);
  isRunning = true;
  isPaused = false;
  tick();
}
function pause() { stop(true); render(); }
function step() {
  stop(true);
  machine.step();
  isPaused = !machine.done;
  render();
}

ui.playBtn.addEventListener('click', play);
ui.pauseBtn.addEventListener('click', pause);
ui.stepBtn.addEventListener('click', step);
ui.resetBtn.addEventListener('click', () => setup(initial));
ui.shuffleBtn.addEventListener('click', () => {
  setup(generate(Number(ui.sizeRange.value), ui.preset.value));
  ui.activity.textContent = `已按“${ui.preset.options[ui.preset.selectedIndex].textContent}”重新生成数组。`;
  if (ui.customInput.value.trim()) {
    ui.inputMessage.textContent = '提示：上方重新生成使用预设分布；输入框中的数字请点击「应用自定义数组」。';
  }
});
ui.sizeRange.addEventListener('input', () => setup(generate(Number(ui.sizeRange.value), ui.preset.value)));
ui.speedRange.addEventListener('input', () => { ui.speedOutput.textContent = `${ui.speedRange.value}×`; });
ui.preset.addEventListener('change', () => setup(generate(Number(ui.sizeRange.value), ui.preset.value)));

function applyCustom() {
  const raw = ui.customInput.value.trim();
  const tokens = raw.split(/[\s,，、;；]+/).filter(Boolean);
  if (tokens.length < 2 || tokens.length > 48 || !tokens.every(s => /^[-+]?\d+$/.test(s))) {
    inputError('请输入 2–48 个整数，用逗号或空格分隔。'); return;
  }
  const values = tokens.map(Number);
  if (!values.every(Number.isSafeInteger) || values.some(v => Math.abs(v) > 999)) {
    inputError('每个数字必须是 -999 到 999 之间的整数。'); return;
  }
  setup(values);
  ui.sizeOutput.textContent = String(values.length);
  ui.preset.value = 'random';
  ui.customInput.value = '';
  ui.inputMessage.textContent = `成功载入 ${values.length} 个整数：${values.join(', ')}。`;
  ui.activity.textContent = '已载入自定义数组。现在可以开始排序。';
}
function inputError(message) {
  ui.inputMessage.classList.add('error');
  ui.inputMessage.textContent = message;
}
ui.applyBtn.addEventListener('click', applyCustom);
ui.customInput.addEventListener('keydown', e => { if (e.key === 'Enter') applyCustom(); });
document.addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey || ['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); isRunning ? pause() : play(); }
  else if (e.code === 'ArrowRight') { e.preventDefault(); step(); }
});
render();
