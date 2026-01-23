import { clamp } from '../../utils/math.js';

export function applyEdgePreserve(original, smoothed, edgeMap, strength, falloff = 'linear') {
  if (!edgeMap || strength <= 0) return smoothed;
  const out = new ImageData(new Uint8ClampedArray(smoothed.data.length), smoothed.width, smoothed.height);
  const src = smoothed.data;
  const base = original.data;
  const dst = out.data;
  const k = clamp(strength, 0, 1);
  const useSmooth = falloff === 'smoothstep';

  for (let i = 0; i < edgeMap.length; i++) {
    let edge = edgeMap[i] * k;
    if (useSmooth) {
      edge = edge * edge * (3 - 2 * edge);
    }
    const keep = edge;
    const mix = 1 - keep;
    const idx = i * 4;
    dst[idx] = src[idx] * mix + base[idx] * keep;
    dst[idx + 1] = src[idx + 1] * mix + base[idx + 1] * keep;
    dst[idx + 2] = src[idx + 2] * mix + base[idx + 2] * keep;
    dst[idx + 3] = base[idx + 3];
  }

  return out;
}

export function applyOutlineMerge(imgData, outlineMap, options) {
  const strength = clamp(options.outlineMergeStrength ?? 0, 0, 1);
  if (!outlineMap || strength <= 0) return imgData;

  const { width, height, data } = imgData;
  const out = new Uint8ClampedArray(data.length);
  const color = getOutlineColor(options.outlineColor);
  const mode = options.outlineBlendMode || 'multiply';

  for (let i = 0; i < outlineMap.length; i++) {
    const t = clamp(outlineMap[i] * strength, 0, 1);
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    if (t <= 0) {
      out[idx] = r;
      out[idx + 1] = g;
      out[idx + 2] = b;
      out[idx + 3] = data[idx + 3];
      continue;
    }

    const blended = blendOutlinePixel(r, g, b, color, mode);
    out[idx] = Math.round(r + (blended[0] - r) * t);
    out[idx + 1] = Math.round(g + (blended[1] - g) * t);
    out[idx + 2] = Math.round(b + (blended[2] - b) * t);
    out[idx + 3] = data[idx + 3];
  }

  return new ImageData(out, width, height);
}

export function getOutlineColor(choice) {
  if (choice === 'accent') return [0, 209, 255];
  if (choice === 'dark') return [20, 20, 20];
  return [0, 0, 0];
}

function blendOutlinePixel(r, g, b, color, mode) {
  const cr = color[0];
  const cg = color[1];
  const cb = color[2];
  if (mode === 'darken') {
    return [Math.min(r, cr), Math.min(g, cg), Math.min(b, cb)];
  }
  if (mode === 'overlay') {
    return [
      blendOverlayChannel(r, cr),
      blendOverlayChannel(g, cg),
      blendOverlayChannel(b, cb)
    ];
  }
  if (mode === 'edge-darken') {
    return [
      Math.max(0, r - 90),
      Math.max(0, g - 90),
      Math.max(0, b - 90)
    ];
  }
  return [
    Math.round((r * cr) / 255),
    Math.round((g * cg) / 255),
    Math.round((b * cb) / 255)
  ];
}

function blendOverlayChannel(base, blend) {
  if (base < 128) {
    return Math.round((2 * base * blend) / 255);
  }
  return Math.round(255 - (2 * (255 - base) * (255 - blend)) / 255);
}
