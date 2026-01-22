import { gaussian, lerp, rgbToLab, labToRgb, clamp } from '../utils/math.js';

export function smoothChroma(imgData, baseData, options = {}) {
  const strength = clamp(options.chromaSmooth ?? 0, 0, 1);
  if (strength <= 0) return imgData;

  const { width, height } = imgData;
  const total = width * height;
  const source = baseData || imgData;
  const radius = clamp(Math.round(1 + strength * 2), 1, 3);
  const sigmaSpace = Math.max(1, options.sigmaSpace || 3);
  const sigmaChroma = 8 + strength * 36;
  const lumaPreserve = clamp(options.lumaPreserve ?? 1, 0, 1);
  const sigmaLuma = 6 + (1 - lumaPreserve) * 24;

  const lBase = new Float32Array(total);
  const lSmooth = new Float32Array(total);
  const aSmooth = new Float32Array(total);
  const bSmooth = new Float32Array(total);

  const srcData = source.data;
  const workData = imgData.data;

  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    const baseLab = rgbToLab(srcData[idx], srcData[idx + 1], srcData[idx + 2]);
    const smoothLab = rgbToLab(workData[idx], workData[idx + 1], workData[idx + 2]);
    lBase[i] = baseLab.L;
    lSmooth[i] = smoothLab.L;
    aSmooth[i] = smoothLab.A;
    bSmooth[i] = smoothLab.B;
  }

  const kernelSize = radius * 2 + 1;
  const spatial = new Float32Array(kernelSize * kernelSize);
  let sIdx = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      spatial[sIdx++] = gaussian(Math.sqrt(dx * dx + dy * dy), sigmaSpace);
    }
  }

  const out = new Uint8ClampedArray(workData.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const center = y * width + x;
      const centerA = aSmooth[center];
      const centerB = bSmooth[center];
      const centerL = lBase[center];

      let sumA = 0;
      let sumB = 0;
      let sumW = 0;
      let k = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) {
          k += kernelSize;
          continue;
        }
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) {
            k++;
            continue;
          }
          const idx = ny * width + nx;
          const dL = lBase[idx] - centerL;
          const dA = aSmooth[idx] - centerA;
          const dB = bSmooth[idx] - centerB;
          const w = spatial[k]
            * gaussian(Math.abs(dL), sigmaLuma)
            * gaussian(Math.sqrt(dA * dA + dB * dB), sigmaChroma);
          sumA += aSmooth[idx] * w;
          sumB += bSmooth[idx] * w;
          sumW += w;
          k++;
        }
      }

      const smoothedA = sumW > 0 ? sumA / sumW : centerA;
      const smoothedB = sumW > 0 ? sumB / sumW : centerB;
      const finalA = lerp(centerA, smoothedA, strength);
      const finalB = lerp(centerB, smoothedB, strength);
      const finalL = lerp(lSmooth[center], centerL, lumaPreserve);
      const rgb = labToRgb(finalL, finalA, finalB);

      const outIdx = center * 4;
      out[outIdx] = rgb.r;
      out[outIdx + 1] = rgb.g;
      out[outIdx + 2] = rgb.b;
      out[outIdx + 3] = workData[outIdx + 3];
    }
  }

  return new ImageData(out, width, height);
}
