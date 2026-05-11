// 工具：圓周率計算示範（劉徽割圓、祖沖之、連分式、Machin/梅欽公式）。

// 劉徽割圓術。formulaId 0–5 對應 6 種不同迭代方式。
// 回傳 { title, rows: [{ i, a, T, p }, ...] }
export function liuHuiCircleCutting(formulaId) {
  const st = '正弦迭代 T = 2 − √(4 − T)';
  const ct = '餘弦迭代 T = 2 + √T';
  let a, T;
  let title = '';
  if (formulaId === 0) { a = 6; T = 1; title = '6 邊 T=1 p=3　 ' + ct; }
  if (formulaId === 1) { a = 4; T = 0; title = '4 邊 T=0 p=2√2' + ct; }
  if (formulaId === 2) { a = 6; T = 1; title = '6 邊 T=1 p=3　 ' + st; }
  if (formulaId === 3) { a = 4; T = 2; title = '4 邊 T=2 p=2√2' + st; }
  if (formulaId === 4) { a = 6; T = 1; title = '6 邊 T=1 補弧田 p=(1+T/24)·3　 ' + st; }
  if (formulaId === 5) { a = 4; T = 2; title = '4 邊 T=2 補弧田 p=(1+T/24)·2√2' + st; }

  const rows = [];
  for (let i = 0; i < 30; i++) {
    a *= 2;
    let p;
    if (formulaId === 0 || formulaId === 1) { T = 2 + Math.sqrt(T); p = a * Math.sqrt(2 - Math.sqrt(T)) / 2; }
    if (formulaId === 2 || formulaId === 3) { T /= 2 + Math.sqrt(4 - T); p = a * Math.sqrt(T) / 2; }
    if (formulaId === 4 || formulaId === 5) { T /= 2 + Math.sqrt(4 - T); p = a * Math.sqrt(T) * (1 + T / 24) / 2; }
    rows.push({ i: i + 1, a, T, p });
  }
  return { title, rows };
}

// 截斷至與 B 相同的有效位數（模擬人工計算）。
export function truncateToDigits(x, B) {
  let m = Math.pow(10, Math.floor(Math.log(x / B) / 2.3));
  if (m < 1) m = 1;
  return Math.floor(x / m + 0.5) * m;
}

// 祖沖之 π 計算（模擬古人算法，弦長／差冪保留 3 位有效數字）。
// 回傳 [{ i, a, T, H, dS, dJ, p }, ...]
export function zuChongzhiPI(R) {
  let a = 6;
  let T = R * R;
  const rows = [];
  for (let i = 0; i < 25; i++) {
    a *= 2;
    T /= 2 + Math.sqrt(4 * R * R - T) / R;
    T = truncateToDigits(T, R);
    if (T < R) break;
    const H  = truncateToDigits(Math.sqrt(T), 100);
    const dS = truncateToDigits(H * H * H / 64 * a / R / R, 100);
    const dJ = truncateToDigits(dS * 4 / 3, 100);
    const p = Math.floor(a * Math.sqrt(T) / 2 + 0.5);
    rows.push({ i: i + 1, a, T, H, dS, dJ, p });
  }
  return rows;
}

// 簡易 π 計算（連分式法 PI = 2 + 1/3·(2 + 2/5·(2 + …)））。
// 回傳結果字串「3.xxxxxxx…」（含換行與分組空格的 HTML）。
export function simplePI(N) {
  N = N + 1;
  let i = Math.round(3.4 * N);
  let b = 2 * i + 1;
  const a = new Array(N).fill(0);
  for (; i > 0; i--, b -= 2, a[0] += 2) {
    let f = 0;
    for (let j = 0; j < N; j++) {
      f = a[j] * i + f * 10;
      a[j] = Math.floor(f / b);
      f %= b;
    }
  }
  for (let k = N - 1; k > 0; k--) {
    a[k - 1] += Math.floor(a[k] / 10);
    a[k] %= 10;
  }
  const head = a[0];
  let body = '';
  for (let k = 1; k < N; k++) {
    let s = String(a[k]);
    if (k % 10 === 0) s += ' ';
    if (k % 100 === 0) s += '\n';
    body += s;
  }
  return head + '.' + body;
}

// Machin（梅欽）公式 PI 計算：PI = 16·arctan(1/5) − 4·arctan(1/239)。
// 多精度算術以 10^10 為一位儲存。
export const machinPICalculator = {
  workA: [],
  workB: [],
  workC: [],

  // 多精度 a += b
  add(a, b, n) {
    let f = 0;
    for (let i = n - 1; i >= 0; i--) {
      a[i] += b[i] + f;
      if (a[i] >= 10000000000) { a[i] -= 10000000000; f = 1; }
      else f = 0;
    }
  },

  // 多精度 r = a − b
  sub(a, b, r, n) {
    let f = 0;
    for (let i = n - 1; i >= 0; i--) {
      r[i] = a[i] - b[i] - f;
      if (r[i] < 0) { r[i] += 10000000000; f = 1; }
      else f = 0;
    }
  },

  // 多精度除以單精度 a /= b
  div(a, b, n) {
    let f = 0;
    for (let i = 0; i < n; i++) {
      const c = a[i] + f * 10000000000;
      a[i] = Math.floor((c + 0.1) / b);
      f = c % b;
    }
  },

  // 倒數 a = f / b（多精度長除法）
  reciprocal(a, f, b, n) {
    a[0] = Math.floor(f / b);
    f = f % b;
    for (let i = 1; i < n; i++) {
      const c = f * 10000000000;
      a[i] = Math.floor((c + 0.1) / b);
      f = c % b;
    }
  },

  // 將陣列置 0 並設首位為 v
  setArray(a, v, n) {
    for (let i = 0; i < n; i++) a[i] = 0;
    a[0] = v;
    a.length = n;
  },

  // v · arctan(1/k)，符號為 zf，結果累加到 workA
  arctan(k, v, zf, N) {
    const n = Math.round(N * 23.1 / Math.log(k * k));
    let i = n;
    const a = this.workA, b = this.workB, c = this.workC;
    for (; i >= 0; i--) {
      let n2 = Math.round((n - i) * N / n) + 1;
      if (n2 > N) n2 = N;
      this.reciprocal(c, v, 2 * i + 1, n2);
      this.div(b, k * k, n2);
      this.sub(c, b, b, n2);
    }
    this.div(b, k, N);
    if (zf > 0) this.add(a, b, N);
    else        this.sub(a, b, a, N);
  },

  // 計算 PI。N 為精度位數（十進位），回傳字串「3.xxxxxxx…」（含換行）。
  // 最後 5 位可能有誤差。
  compute(N) {
    const slots = Math.floor(N / 10 + 1.5);
    this.setArray(this.workA, 0, slots);
    this.setArray(this.workB, 0, slots);
    this.arctan(5,   16,  1, slots);
    this.arctan(239,  4, -1, slots);
    const head = this.workA[0];
    let body = '';
    for (let i = 1; i < slots; i++) {
      // 補足 10 位
      const s = String(10000000000 + this.workA[i]).substr(1, 10);
      body += s;
      if (i % 10 === 0) body += '\n';
      else              body += ' ';
    }
    return head + '.' + body;
  },
};

// 清空輸出（UI 層自行清空，函式僅提供語意）。
export function clearToolOutput() {
  return '';
}
