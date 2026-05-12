// 站心觀測視圖：日月食放大圖（無世界地圖背景版本）

import { RAD_TO_ARCSEC } from '../../astro/constants.js';
import { normalizeAngleSigned } from '../../astro/math-utils.js';
import {
  initCanvas,
  drawCircleFilled,
  drawText,
  clearCanvas,
} from './draw-helpers.js';

// 視圖物件
// 內部狀態：畫布、中心座標、像素比例
// 預設「32 角分對應畫布最短邊的一半」，使日輪／月輪以實際相對視半徑呈現
export function createEclipseLocalView(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  const halfMin = Math.min(w, h) / 2;
  // pixels per arcsecond：32 角分 = halfMin 像素
  const pxPerArcsec = halfMin / (32 * 60);

  return {
    canvas,
    ctx,
    cx,
    cy,
    pxPerArcsec,

    clear() {
      clearCanvas(canvas);
    },

    // 畫日食放大圖
    //   J1, W1：月亮赤經、赤緯（弧度）
    //   J2, W2：太陽赤經、赤緯（弧度）
    //   mr, sr：月、日視半徑（角秒）
    drawSolarMagnified(J1, W1, J2, W2, mr, sr) {
      // 月亮東行；視圖中向右為東，因此經度差取反
      const dJraw = -normalizeAngleSigned(J1 - J2);
      const dWraw = W1 - W2;
      // 球面差換算為平面（小角度近似 cos((W1+W2)/2)）
      const dJ = dJraw * Math.cos((W1 + W2) / 2) * RAD_TO_ARCSEC; // 角秒
      const dW = dWraw * RAD_TO_ARCSEC; // 角秒

      // 出界檢查（過遠不繪）
      if (Math.abs(dJ) > 32 * 60 * 3.5 || Math.abs(dW) > 32 * 60 * 2.5) return false;

      const ox = dJ * pxPerArcsec;
      const oy = -dW * pxPerArcsec;
      const sunR  = sr * pxPerArcsec;
      const moonR = mr * pxPerArcsec;
      drawCircleFilled(ctx, cx,      cy,      sunR,  '#ff5252'); // 太陽
      drawCircleFilled(ctx, cx + ox, cy + oy, moonR, '#a0a000'); // 月亮
      return true;
    },

    // 畫月食放大圖
    //   J1, W1：月亮赤經、赤緯
    //   J2, W2：地影赤經、赤緯
    //   mr：月視半徑（角秒）
    //   er：本影半徑（角秒）
    //   Er：半影半徑（角秒）
    drawLunarMagnified(J1, W1, J2, W2, mr, er, Er) {
      // 月食放大圖以「2 倍解析度」呈現：放大半個視野（16 角分對應 halfMin）
      const lunarScale = pxPerArcsec / 2;
      const dJraw = -normalizeAngleSigned(J1 - J2);
      const dWraw = W1 - W2;
      const dJ = dJraw * Math.cos((W1 + W2) / 2) * RAD_TO_ARCSEC;
      const dW = dWraw * RAD_TO_ARCSEC;

      if (Math.abs(dJ) > 32 * 60 * 3.5 || Math.abs(dW) > 32 * 60 * 2.5) return false;

      const ox = dJ * lunarScale;
      const oy = -dW * lunarScale;
      const moonR    = mr * lunarScale;
      const umbraR   = er * lunarScale;
      const penumbraR= Er * lunarScale;
      // 月亮在前；先畫半影、本影背景，再畫月亮
      drawCircleFilled(ctx, cx, cy, penumbraR, 'rgba(0,0,0,0.2)');
      drawCircleFilled(ctx, cx, cy, umbraR,    'rgba(0,0,0,0.4)');
      drawCircleFilled(ctx, cx + ox, cy + oy, moonR, '#a0a000');
      return true;
    },

    // 在角落寫一行說明文字
    annotate(text, color = '#444', font = '12px sans-serif') {
      drawText(ctx, 6, 4, text, color, font);
    },
  };
}
