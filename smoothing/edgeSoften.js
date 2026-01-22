import { clamp, lerp } from '../utils/math.js';

export function softenEdges(imgData, edgeMap, amount) {
  const strength = clamp(amount ?? 0, 0, 1);
  if (!edgeMap || strength <= 0) return imgData;

  const blurred = blur3x3(imgData);
  const { width, height, data } = imgData;
  const out = new Uint8ClampedArray(data.length);

  for (let i = 0; i < edgeMap.length; i++) {
    const t = clamp(edgeMap[i] * strength, 0, 1);
    const idx = i * 4;
    out[idx] = Math.round(lerp(data[idx], blurred.data[idx], t));
    out[idx + 1] = Math.round(lerp(data[idx + 1], blurred.data[idx + 1], t));
    out[idx + 2] = Math.round(lerp(data[idx + 2], blurred.data[idx + 2], t));
    out[idx + 3] = data[idx + 3];
  }

  return new ImageData(out, width, height);
}

function blur3x3(imgData) {
  const { width, height, data } = imgData;
  const out = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let count = 0;

      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const idx = (ny * width + nx) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          a += data[idx + 3];
          count++;
        }
      }

      const outIdx = (y * width + x) * 4;
      out[outIdx] = Math.round(r / count);
      out[outIdx + 1] = Math.round(g / count);
      out[outIdx + 2] = Math.round(b / count);
      out[outIdx + 3] = Math.round(a / count);
    }
  }

  return new ImageData(out, width, height);
}
