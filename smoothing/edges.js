export function detectEdges(imgData, options = {}) {
  const { width, height, data } = imgData;
  const luma = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    luma[i] = 0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2];
  }

  const edge = new Float32Array(width * height);
  const invMax = 1 / 1443;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const tl = luma[i - width - 1];
      const tc = luma[i - width];
      const tr = luma[i - width + 1];
      const ml = luma[i - 1];
      const mr = luma[i + 1];
      const bl = luma[i + width - 1];
      const bc = luma[i + width];
      const br = luma[i + width + 1];

      const gx = (-tl - 2 * ml - bl) + (tr + 2 * mr + br);
      const gy = (tl + 2 * tc + tr) - (bl + 2 * bc + br);
      const mag = Math.sqrt(gx * gx + gy * gy) * invMax;
      edge[i] = Math.min(1, mag);
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
