// 食程時間軸繪製（水平條圖）。
//
// 用途：給定一組關鍵時刻（力學時 JD，J2000 起算）與標籤，
// 在 canvas 上繪製水平時間軸，並把每個關鍵時刻以縱線 + 文字標記。
// 自動採用 5 個刻度均勻分布的時間刻度，刻度以「北京時 HH:MM:SS」顯示。

import { J2000 } from '../../astro/constants.js';
import { jdToGregorian } from '../../astro/julian-day.js';
import { deltaT } from '../../astro/delta-t.js';

const DEFAULT_OPTS = {
  background:    '#0d1116',
  axis:          '#5d6c7a',
  axisText:      '#9aa5b2',
  tickText:      '#7a8390',
  markerColors:  {
    P1: '#4ea0ff',  // 初虧
    U1: '#ffa040',  // 食既
    Max: '#ff5252', // 食甚
    U4: '#ffa040',  // 生光
    P4: '#4ea0ff',  // 復圓
    Pe1: '#5d6c7a', // 半影食始
    Pe4: '#5d6c7a', // 半影食終
  },
  labelFont: 'bold 11px sans-serif',
  tickFont:  '10px sans-serif',
  marginX:   60,
  marginTop: 30,
  marginBot: 40,
};

function pad2(n) { return (n < 10 ? '0' : '') + Math.floor(n); }

// 力學時 JD → 北京時 HH:MM:SS
function fmtBJTime(jdTD) {
  if (jdTD === undefined || jdTD === null || isNaN(jdTD)) return '—';
  const jdUT = jdTD - deltaT(jdTD);
  const g = jdToGregorian(jdUT + 8 / 24 + J2000);
  return `${pad2(g.hour)}:${pad2(g.minute)}:${pad2(Math.round(g.second))}`;
}

// events: [{ jd, key, label }]
// jd 為 J2000 起算的力學時 JD；label 為中文標籤；key 為 P1/U1/Max/U4/P4/Pe1/Pe4
export function drawEclipseTimeline(canvas, events, opts = {}) {
  const o = { ...DEFAULT_OPTS, ...opts, markerColors: { ...DEFAULT_OPTS.markerColors, ...(opts.markerColors || {}) } };
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.fillStyle = o.background;
  ctx.fillRect(0, 0, W, H);

  const valid = events.filter((e) => e && typeof e.jd === 'number' && !isNaN(e.jd) && e.jd !== 0);
  if (valid.length < 2) {
    ctx.fillStyle = o.axisText;
    ctx.font = o.labelFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('無足夠時間點以繪製時間軸', W / 2, H / 2);
    return;
  }

  let jdMin = Math.min(...valid.map((e) => e.jd));
  let jdMax = Math.max(...valid.map((e) => e.jd));
  const span = jdMax - jdMin;
  // 兩端各加 10% 邊距
  const pad = span * 0.1 || 1 / 86400;
  jdMin -= pad;
  jdMax += pad;

  const x0 = o.marginX;
  const x1 = W - o.marginX;
  const yAxis = H - o.marginBot;
  const jdToX = (jd) => x0 + ((jd - jdMin) / (jdMax - jdMin)) * (x1 - x0);

  // 主軸線
  ctx.strokeStyle = o.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, yAxis);
  ctx.lineTo(x1, yAxis);
  ctx.stroke();

  // 時間刻度（5 段）
  ctx.fillStyle = o.tickText;
  ctx.font = o.tickFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const t = jdMin + (i / 5) * (jdMax - jdMin);
    const px = jdToX(t);
    ctx.strokeStyle = o.axis;
    ctx.beginPath();
    ctx.moveTo(px, yAxis - 4);
    ctx.lineTo(px, yAxis + 4);
    ctx.stroke();
    ctx.fillText(fmtBJTime(t), px, yAxis + 8);
  }

  // 各事件標記
  ctx.textBaseline = 'alphabetic';
  ctx.font = o.labelFont;
  // 標籤垂直堆疊偏移以避免重疊
  const sorted = valid.slice().sort((a, b) => a.jd - b.jd);
  let lastX = -Infinity;
  let stagger = 0;
  for (const e of sorted) {
    const px = jdToX(e.jd);
    const col = o.markerColors[e.key] || '#ffffff';
    // 縱線
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, o.marginTop);
    ctx.lineTo(px, yAxis);
    ctx.stroke();
    // 圓點
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px, yAxis, 4, 0, Math.PI * 2);
    ctx.fill();
    // 標籤垂直分層
    if (px - lastX < 80) stagger = (stagger + 1) % 3; else stagger = 0;
    lastX = px;
    const labelY = o.marginTop - 4 + stagger * 14;
    ctx.textAlign = 'center';
    ctx.fillStyle = col;
    ctx.fillText(e.label, px, labelY);
    // 時刻
    ctx.fillStyle = o.tickText;
    ctx.font = o.tickFont;
    ctx.fillText(fmtBJTime(e.jd), px, labelY + 12);
    ctx.font = o.labelFont;
  }
}
