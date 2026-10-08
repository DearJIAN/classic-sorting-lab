# Sorting Lab · 十大经典排序算法 + 冒泡排序交互实验室

> 纯原生 JavaScript、零第三方依赖、中文响应式网页、可重复运行的自动化测试。

![交互式冒泡排序网页预览](docs/preview.svg)

本项目实现 **10 大经典排序算法**，并提供独立的 **冒泡排序交互网页**。网页以“一次相邻比较 = 一帧”的方式逐步演示算法运行过程，清晰展示每次比较、是否交换、已排序区间及实时统计。

## 项目包含哪些算法？

| # | 算法 | 导出函数 | 平均时间复杂度 | 额外空间复杂度 | 稳定性 |
|---|---|---|---|---|---|
| 01 | 冒泡排序 (Bubble) | `bubbleSort` | O(n²) | O(1) | 稳定 |
| 02 | 选择排序 (Selection) | `selectionSort` | O(n²) | O(1) | 不稳定 |
| 03 | 插入排序 (Insertion) | `insertionSort` | O(n²) | O(1) | 稳定 |
| 04 | 希尔排序 (Shell) | `shellSort` | 依赖增量序列 | O(1) | 不稳定 |
| 05 | 归并排序 (Merge) | `mergeSort` | O(n log n) | O(n) | 稳定 |
| 06 | 快速排序 (Quick) | `quickSort` | O(n log n) | O(log n) 平均 | 不稳定 |
| 07 | 堆排序 (Heap) | `heapSort` | O(n log n) | O(1) | 不稳定 |
| 08 | 计数排序 (Counting) | `countingSort` | O(n + k) | O(k) | 稳定（返回值意义下） |
| 09 | 基数排序 (Radix) | `radixSort` | O(d(n + b)) | O(n + b) | 稳定（返回值意义下） |
| 10 | 桶排序 (Bucket) | `bucketSort` | 期望 O(n + k) | O(n + k) | 稳定（返回值意义下） |

注：表中空间复杂度描述的是经典算法主体（排除该项目统一要求的“复制输入”和返回结果的 O(n) 容器成本）。计数排序在取值范围超过 100 万时自动回退至归并排序，避免巨量内存分配。部分非比较排序的“稳定”指实现步骤会保留相同键的原有次序；本项目当前使用普通整数，无法观察相同键的对象身份。

## 立即运行网页

Node.js >= 20：

```bash
npm run dev
```

然后打开浏览器 **http://127.0.0.1:4173/**。无需 npm install（没有外部依赖）。

如果已有 Python 3，也可在仓库根目录运行 `python -m http.server 4173`，并访问 `http://127.0.0.1:4173/web/`。

注意：网页使用原生 ES Modules，需要通过本地 HTTP 服务运行；直接双击 `web/index.html` 可能受到浏览器的 `file://` 模块安全限制。

### 网页交互

- **开始 / 暂停 / 继续 / 重置**：根据当前状态控制运行。
- **单步执行**：每点击一次只推进一次相邻元素比较（可能伴随一次交换）。
- **调整速度**：1×～5×；可在运行中调整。
- **修改数组长度**：5～48 个元素，重新生成初始数据。
- **选择数据分布**：随机、逆序、近乎有序、完全有序。
- **自定义数组**：输入 2～48 个整数（-999～999），支持负数和重复值。
- **即时可视化**：橙色正在比较，绿色表示确认有序，蓝绿表示尚未有序。
- **算法学习**：比较次数、交换次数、完成轮次、复杂度、稳定性和伪代码。
- **键盘快捷键**：焦点不在输入框/按钮等交互控件上时，`Space` 播放/暂停、`→` 单步。

## 如何调用排序算法

```js
import { algorithms, quickSort, mergeSort } from './src/sorts.js';
const data = [8, -1, 3, 8, 5];
console.log(quickSort(data));      // [-1, 3, 5, 8, 8]
console.log(mergeSort(data));      // [-1, 3, 5, 8, 8]
console.log(algorithms.bubble.sort(data)); // [-1, 3, 5, 8, 8]
console.log(data); // [8, -1, 3, 8, 5] — 原数组未更改
```

**统一约束**：API 只接受 `Number.isSafeInteger` 范围内的整数数组，并且都返回新的升序数组，不直接修改调用方输入。

## 自动化测试

```bash
npm test
```

在具备 Python Playwright + Chromium 的环境中还可以运行 `python tests/browser_smoke.py`，验证自定义输入、开始暂停、单步执行、预设生成，以及单文件离线版等真实浏览器行为。

测试覆盖 10 种算法的空数组、单元素、逆序、有序、重复数、负数、极大整数、70 组伪随机数组、输入不可变性，以及冒泡状态机的逐步推进、提前结束和终止性。

## 目录结构

```text
classic-sorting-lab/
├── README.md
├── package.json
├── src/
│   ├── sorts.js             # 十大经典排序算法，统一 API
│   └── bubble-machine.js    # 冒泡排序的逐比较状态机
├── web/
│   ├── index.html           # 网页结构、算法知识面板
│   ├── styles.css           # 深色响应式页面、排序动画
│   └── app.js               # 播放/暂停/调速/自定义输入/渲染
├── scripts/
│   └── dev-server.mjs       # 无依赖本地 HTTP 服务
├── tests/
│   ├── sorts.test.js
│   └── bubble-machine.test.js
└── .github/workflows/test.yml  # push/PR 自动执行 npm test
```

## 设计说明

- 为保证算法可独立运行，`src/sorts.js` 与网页 UI 解耦。
- 为保证单步行为可测试，`BubbleMachine.step()` 只进行一次相邻比较，不依赖计时器或 DOM。
- 为避免排序动画与 UI 状态脱节，播放按钮只驱动一个计时循环；切换数组、重置或暂停都会取消旧计时器。
- 已排序区间只在每轮结束后确认；如果一整轮未交换，则触发提前终止。
- 页面所用的 SVG/字体/样式全部本地实现，没有使用外部 CDN。

## 上传至 GitHub 私有仓库

如果已经在本地安装并登录 [GitHub CLI](https://cli.github.com/)，解压后进入项目目录，执行：

```bash
bash scripts/publish-github.sh classic-sorting-lab
```

这个脚本会在已登录的 GitHub 账号下创建一个**新的私有仓库**并推送代码；不会覆盖现有 `origin` 仓库。如果还没有 GitHub CLI，请先安装并运行 `gh auth login`。

项目源码也可以提交到任何你有写入权限的 GitHub 私有仓库。私有仓库默认不能作为对外公开的 GitHub Pages 站点使用，是否支持 Pages 取决于你的 GitHub 套餐和仓库设置；本地运行不受影响。
