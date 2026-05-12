// 世界地圖背景繪製（等距矩形投影）。
//
// 提供 createWorldMap(canvas, opts) 工廠：
//   • lonLatToXY(lonDeg, latDeg)：經緯度（度）→ 畫布像素座標
//   • drawBackground()：背景填色 + 經緯網格 + 海岸線
//   • size：{ width, height }
//
// 投影：經度 −180~+180 對應 0~width；緯度 +90~−90 對應 0~height。

import { WORLD_COASTLINES } from '../../data/world-coastlines.js';

const DEFAULT_OPTS = {
  background: '#0d1116',
  graticule:  '#2a3038',
  meridian:   '#3a414b',
  coastline:  '#5d6c7a',
  landFill:   '#1a2128',
  gridStep:   30,
  showLabels: true,
  labelColor: '#666',
};

export function createWorldMap(canvas, opts = {}) {
  const o = { ...DEFAULT_OPTS, ...opts };
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const lonLatToXY = (lonDeg, latDeg) => {
    const x = ((lonDeg + 180) / 360) * W;
    const y = ((90 - latDeg) / 180) * H;
    return [x, y];
  };

  const drawBackground = () => {
    ctx.fillStyle = o.background;
    ctx.fillRect(0, 0, W, H);

    // 海岸線填色（陸地）
    ctx.fillStyle = o.landFill;
    for (const poly of WORLD_COASTLINES) {
      ctx.beginPath();
      for (let i = 0; i < poly.length; i++) {
        const [px, py] = lonLatToXY(poly[i][0], poly[i][1]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    // 經緯網格
    ctx.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += o.gridStep) {
      const px = ((lon + 180) / 360) * W;
      ctx.strokeStyle = lon === 0 ? o.meridian : o.graticule;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
    }
    for (let lat = -90; lat <= 90; lat += o.gridStep) {
      const py = ((90 - lat) / 180) * H;
      ctx.strokeStyle = lat === 0 ? o.meridian : o.graticule;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(W, py);
      ctx.stroke();
    }

    // 海岸線輪廓
    ctx.strokeStyle = o.coastline;
    ctx.lineWidth = 1;
    for (const poly of WORLD_COASTLINES) {
      ctx.beginPath();
      for (let i = 0; i < poly.length; i++) {
        const [px, py] = lonLatToXY(poly[i][0], poly[i][1]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 軸標籤
    if (o.showLabels) {
      ctx.fillStyle = o.labelColor;
      ctx.font = '10px sans-serif';
      ctx.textBaseline = 'top';
      for (let lon = -180; lon <= 180; lon += o.gridStep) {
        if (lon === -180 || lon === 180) continue;
        const px = ((lon + 180) / 360) * W;
        ctx.fillText(lon + '°', px + 2, 2);
      }
      for (let lat = -90; lat <= 90; lat += o.gridStep) {
        if (lat === 90 || lat === -90) continue;
        const py = ((90 - lat) / 180) * H;
        ctx.fillText(lat + '°', 2, py + 2);
      }
    }
  };

  return {
    lonLatToXY,
    drawBackground,
    ctx,
    size: { width: W, height: H },
  };
}
