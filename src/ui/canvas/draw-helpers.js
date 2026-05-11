// Canvas 低階繪圖原語

// 初始化畫布物件；可重複呼叫，已初始化則略過
export function initCanvas(target, canvas) {
  if (target.isInit) return;
  target.isInit = 1;
  target.can = canvas;
  target.ctx = canvas.getContext('2d');
  target.ctx.lineWidth = 1;
  target.w = canvas.width - 0;
  target.h = canvas.height - 0;
}

// 畫空心圓
export function drawCircleOutline(ctx, x, y, r, col) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.strokeStyle = col;
  ctx.closePath();
  ctx.stroke();
}

// 畫實心圓
export function drawCircleFilled(ctx, x, y, r, col) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = col;
  ctx.closePath();
  ctx.fill();
}

// 畫直線
export function drawLine(ctx, x1, y1, x2, y2, col) {
  ctx.beginPath();
  ctx.strokeStyle = col;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.closePath();
}

// 繪製文字
export function drawText(ctx, x, y, txt, col, font) {
  ctx.font = font;
  ctx.textBaseline = 'top';
  ctx.fillStyle = col;
  ctx.fillText(txt, x, y);
}

// 清除整個畫布（並重置內容）
export function clearCanvas(canvas) {
  // 同時清除路徑與重設大小屬性，跨瀏覽器都會清空像素
  canvas.width = canvas.width;
}
