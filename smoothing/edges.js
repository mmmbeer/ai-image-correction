export function detectEdges(imgData, options = {}) {
  const { width, height, data } = imgData;
  const total = width * height;
  const luma = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    luma[i] = 0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2];
  }

  const preBlur = Math.max(0, Math.min(3, Math.floor(options.preBlur || 0)));
  const lumaSrc = preBlur > 0 ? blurEdgeMap(luma, width, height, preBlur) : luma;

  const edge = new Float32Array(total);
  const kernel = (options.kernel || 'sobel').toLowerCase();
  const invMax = kernel === 'scharr' ? (1 / 5776) : (1 / 1443);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const tl = lumaSrc[i - width - 1];
      const tc = lumaSrc[i - width];
      const tr = lumaSrc[i - width + 1];
      const ml = lumaSrc[i - 1];
      const mr = lumaSrc[i + 1];
      const bl = lumaSrc[i + width - 1];
      const bc = lumaSrc[i + width];
      const br = lumaSrc[i + width + 1];

      let gx = 0;
      let gy = 0;
      if (kernel === 'scharr') {
        gx = (-3 * tl - 10 * ml - 3 * bl) + (3 * tr + 10 * mr + 3 * br);
        gy = (3 * tl + 10 * tc + 3 * tr) - (3 * bl + 10 * bc + 3 * br);
      } else {
        gx = (-tl - 2 * ml - bl) + (tr + 2 * mr + br);
        gy = (tl + 2 * tc + tr) - (bl + 2 * bc + br);
      }

      let mag = Math.sqrt(gx * gx + gy * gy) * invMax;
      mag = Math.min(1, Math.max(0, mag));
      edge[i] = mag;
    }
  }

  const threshold = Math.max(0, Math.min(1, options.threshold ?? 0));
  const sensitivity = Math.max(0, Math.min(1, options.sensitivity ?? 0.5));
  if (threshold > 0 || sensitivity !== 0.5) {
    const gain = 0.6 + sensitivity * 2.2;
    for (let i = 0; i < edge.length; i++) {
      let v = Math.min(1, edge[i] * gain);
      if (threshold > 0) {
        v = v <= threshold ? 0 : (v - threshold) / (1 - threshold);
      }
      edge[i] = v;
    }
  }

  const smooth = Math.max(0, Math.min(3, Math.floor(options.smooth || 0)));
  if (smooth > 0) {
    let refined = closeEdgeMap(edge, width, height, smooth);
    refined = blurEdgeMap(refined, width, height, 1);
    refined = hardenEdgeMap(refined, 0.2);
    return refined;
  }

  return edge;
}

export function edgeMapToImageData(edgeMap, width, height, options = {}) {
  const color = options.color || [0, 255, 204];
  const opacity = Math.max(0, Math.min(1, options.opacity ?? 0.75));
  const out = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < edgeMap.length; i++) {
    const v = edgeMap[i];
    if (v <= 0) continue;
    const idx = i * 4;
    out[idx] = color[0];
    out[idx + 1] = color[1];
    out[idx + 2] = color[2];
    out[idx + 3] = Math.round(255 * opacity * v);
  }

  return new ImageData(out, width, height);
}

export function edgeMapToGrayscale(edgeMap, width, height, options = {}) {
  const invert = !!options.invert;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < edgeMap.length; i++) {
    const v = Math.max(0, Math.min(1, edgeMap[i]));
    const level = invert ? Math.round(255 * (1 - v)) : Math.round(255 * v);
    const idx = i * 4;
    out[idx] = level;
    out[idx + 1] = level;
    out[idx + 2] = level;
    out[idx + 3] = 255;
  }
  return new ImageData(out, width, height);
}

export function edgeMapToHeatmap(edgeMap, width, height, options = {}) {
  const opacity = Math.max(0, Math.min(1, options.opacity ?? 1));
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < edgeMap.length; i++) {
    const v = Math.max(0, Math.min(1, edgeMap[i]));
    let r = 0;
    let g = 0;
    let b = 0;
    if (v < 0.33) {
      const t = v / 0.33;
      r = 0;
      g = Math.round(120 + 135 * t);
      b = Math.round(220 + 35 * t);
    } else if (v < 0.66) {
      const t = (v - 0.33) / 0.33;
      r = Math.round(0 + 255 * t);
      g = 255;
      b = Math.round(255 - 255 * t);
    } else {
      const t = (v - 0.66) / 0.34;
      r = 255;
      g = Math.round(255 - 190 * t);
      b = Math.round(0 + 30 * t);
    }
    const idx = i * 4;
    out[idx] = r;
    out[idx + 1] = g;
    out[idx + 2] = b;
    out[idx + 3] = Math.round(255 * opacity);
  }
  return new ImageData(out, width, height);
}

export function buildOutlineMap(edgeMap, width, height, options = {}) {
  const mode = options.mode === 'binary' ? 'binary' : 'weighted';
  const threshold = Math.max(0, Math.min(1, options.threshold ?? 0.2));
  const thickness = Math.max(1, Math.min(6, Math.floor(options.thickness || 1)));
  const thin = !!options.thin;

  let base = edgeMap;
  if (thin) {
    base = thinEdgeMap(base, width, height);
  }

  const out = new Float32Array(edgeMap.length);
  for (let i = 0; i < base.length; i++) {
    const v = Math.max(0, Math.min(1, base[i]));
    if (mode === 'binary') {
      out[i] = v >= threshold ? 1 : 0;
    } else {
      out[i] = v <= threshold ? 0 : (v - threshold) / (1 - threshold);
    }
  }

  if (thickness > 1) {
    let expanded = out;
    for (let i = 1; i < thickness; i++) {
      expanded = dilateEdgeMap(expanded, width, height);
    }
    return expanded;
  }

  return out;
}

export function expandEdgeMap(edgeMap, width, height, radius) {
  const r = Math.max(0, Math.min(6, Math.floor(radius || 0)));
  if (r === 0) return edgeMap;
  let out = edgeMap;
  for (let i = 0; i < r; i++) {
    out = blurEdgeMap(out, width, height, 1);
    out = dilateEdgeMap(out, width, height);
  }
  return out;
}

function blurEdgeMap(edgeMap, width, height, radius) {
  let src = edgeMap;
  let dst = new Float32Array(edgeMap.length);

  for (let pass = 0; pass < radius; pass++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            sum += src[ny * width + nx];
            count++;
          }
        }
        dst[y * width + x] = sum / count;
      }
    }
    const tmp = src;
    src = dst;
    dst = tmp;
  }

  return src;
}

function closeEdgeMap(edgeMap, width, height, passes) {
  let src = edgeMap;
  for (let i = 0; i < passes; i++) {
    const dilated = dilateEdgeMap(src, width, height);
    src = erodeEdgeMap(dilated, width, height);
  }
  return src;
}

function dilateEdgeMap(edgeMap, width, height) {
  const out = new Float32Array(edgeMap.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let max = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const v = edgeMap[ny * width + nx];
          if (v > max) max = v;
        }
      }
      out[y * width + x] = max;
    }
  }
  return out;
}

function erodeEdgeMap(edgeMap, width, height) {
  const out = new Float32Array(edgeMap.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let min = 1;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const v = edgeMap[ny * width + nx];
          if (v < min) min = v;
        }
      }
      out[y * width + x] = min;
    }
  }
  return out;
}

function hardenEdgeMap(edgeMap, threshold) {
  const out = new Float32Array(edgeMap.length);
  const t = Math.max(0, Math.min(0.6, threshold));
  const inv = 1 / Math.max(0.001, 1 - t);
  for (let i = 0; i < edgeMap.length; i++) {
    const v = edgeMap[i];
    const boosted = Math.max(0, v - t) * inv;
    out[i] = Math.min(1, boosted);
  }
  return out;
}

function thinEdgeMap(edgeMap, width, height) {
  const out = new Float32Array(edgeMap.length);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const v = edgeMap[idx];
      const north = edgeMap[idx - width];
      const south = edgeMap[idx + width];
      const east = edgeMap[idx + 1];
      const west = edgeMap[idx - 1];
      out[idx] = (v >= north && v >= south && v >= east && v >= west) ? v : 0;
    }
  }
  return out;
}
