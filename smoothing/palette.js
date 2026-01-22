import { clamp, lerp } from '../utils/math.js';
import { quantize } from './quantize.js';

export function simplifyPalette(imgData, options = {}) {
  let out = imgData;
  const levels = Math.floor(options.paletteLevels || 0);
  if (levels > 1) {
    out = quantize(out, levels);
  }

  const strength = clamp(options.neighborMerge ?? 0, 0, 1);
  if (strength <= 0) return out;

  const radius = strength > 0.65 ? 2 : 1;
  return mergeNeighborColors(out, levels > 1 ? levels : 12, strength, radius);
}

function mergeNeighborColors(imgData, levels, strength, radius) {
  const { width, height, data } = imgData;
  const out = new Uint8ClampedArray(data.length);
  const safeLevels = clamp(Math.floor(levels), 2, 32);
  const step = 255 / (safeLevels - 1);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const counts = new Map();
      let maxKey = 0;
      let maxCount = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const idx = (ny * width + nx) * 4;
          const rBin = clamp(Math.round(data[idx] / step), 0, safeLevels - 1);
          const gBin = clamp(Math.round(data[idx + 1] / step), 0, safeLevels - 1);
          const bBin = clamp(Math.round(data[idx + 2] / step), 0, safeLevels - 1);
          const key = (rBin << 16) | (gBin << 8) | bBin;
          const next = (counts.get(key) || 0) + 1;
          counts.set(key, next);
          if (next > maxCount) {
            maxCount = next;
            maxKey = key;
          }
        }
      }

      const rBin = (maxKey >> 16) & 0xff;
      const gBin = (maxKey >> 8) & 0xff;
      const bBin = maxKey & 0xff;
      const targetR = rBin * step;
      const targetG = gBin * step;
      const targetB = bBin * step;

      const outIdx = (y * width + x) * 4;
      out[outIdx] = Math.round(lerp(data[outIdx], targetR, strength));
      out[outIdx + 1] = Math.round(lerp(data[outIdx + 1], targetG, strength));
      out[outIdx + 2] = Math.round(lerp(data[outIdx + 2], targetB, strength));
      out[outIdx + 3] = data[outIdx + 3];
    }
  }

  return new ImageData(out, width, height);
}
