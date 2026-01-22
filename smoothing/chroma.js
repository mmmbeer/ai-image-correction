import { gaussian, lerp, rgbToLab, labToRgb, clamp } from '../utils/math.js';

function rgbToHsv(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;

  if (delta > 0.0001) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;
  return { h, s, v };
}

function hueDistance(a, b) {
  const d = Math.abs(a - b);
  return Math.min(d, 360 - d);
}

export function smoothChroma(imgData, baseData, options = {}) {
  const strength = clamp(options.chromaSmooth ?? 0, 0, 1);
  if (strength <= 0) return imgData;

  const { width, height } = imgData;
  const total = width * height;
  const source = baseData || imgData;
  const radius = clamp(Math.round(options.chromaRadius ?? (1 + strength * 2)), 1, 6);
  const sigmaSpace = Math.max(0.5, options.chromaSigmaSpace ?? 3);
  const sigmaChroma = Math.max(1, options.chromaSigmaColor ?? (8 + strength * 36));
  const lumaPreserve = clamp(options.lumaPreserve ?? 1, 0, 1);
  const sigmaLuma = 6 + (1 - lumaPreserve) * 24;
  const channelAMult = clamp(options.chromaSmoothA ?? 1, 0, 1);
  const channelBMult = clamp(options.chromaSmoothB ?? 1, 0, 1);
  const lumaProtect = clamp(options.lumaProtect ?? 0, 0, 1);
  const neutralProtect = clamp(options.neutralProtect ?? 0, 0, 1);
  const chromaClamp = clamp(options.chromaClamp ?? 0, 0, 1);
  const adaptiveStrength = clamp(options.adaptiveChroma ?? 0, 0, 1);
  const protectSkin = !!options.protectSkin;

  const baseL = new Float32Array(total);
  const baseA = new Float32Array(total);
  const baseB = new Float32Array(total);
  const workL = new Float32Array(total);
  const workA = new Float32Array(total);
  const workB = new Float32Array(total);

  const srcData = source.data;
  const workData = imgData.data;

  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    const baseLab = rgbToLab(srcData[idx], srcData[idx + 1], srcData[idx + 2]);
    const smoothLab = rgbToLab(workData[idx], workData[idx + 1], workData[idx + 2]);
    baseL[i] = baseLab.L;
    baseA[i] = baseLab.A;
    baseB[i] = baseLab.B;
    workL[i] = smoothLab.L;
    workA[i] = smoothLab.A;
    workB[i] = smoothLab.B;
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
      const centerA = workA[center];
      const centerB = workB[center];
      const centerL = baseL[center];

      let sumA = 0;
      let sumB = 0;
      let sumW = 0;
      let sumC = 0;
      let sumC2 = 0;
      let sampleCount = 0;
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
          const dL = baseL[idx] - centerL;
          const dA = workA[idx] - centerA;
          const dB = workB[idx] - centerB;
          const w = spatial[k]
            * gaussian(Math.abs(dL), sigmaLuma)
            * gaussian(Math.sqrt(dA * dA + dB * dB), sigmaChroma);
          sumA += workA[idx] * w;
          sumB += workB[idx] * w;
          sumW += w;

          if (adaptiveStrength > 0) {
            const c = Math.sqrt(workA[idx] * workA[idx] + workB[idx] * workB[idx]);
            sumC += c;
            sumC2 += c * c;
            sampleCount += 1;
          }
          k++;
        }
      }

      const smoothedA = sumW > 0 ? sumA / sumW : centerA;
      const smoothedB = sumW > 0 ? sumB / sumW : centerB;

      let mask = 1;
      if (neutralProtect > 0) {
        const baseC = Math.sqrt(baseA[center] * baseA[center] + baseB[center] * baseB[center]);
        const neutral = clamp((12 - baseC) / 12, 0, 1);
        mask *= 1 - neutralProtect * neutral;
      }

      if (lumaProtect > 0) {
        const L = baseL[center];
        const shadow = clamp((18 - L) / 18, 0, 1);
        const highlight = clamp((L - 86) / 14, 0, 1);
        const extreme = Math.max(shadow, highlight);
        mask *= 1 - lumaProtect * extreme;
      }

      if (protectSkin) {
        const srcIdx = center * 4;
        const hsv = rgbToHsv(srcData[srcIdx], srcData[srcIdx + 1], srcData[srcIdx + 2]);
        const skinCenter = 28;
        const skinRange = 18;
        const skinFalloff = 10;
        const hueDelta = hueDistance(hsv.h, skinCenter);
        let skinMask = 0;
        if (hsv.s > 0.15 && hsv.v > 0.2) {
          if (hueDelta <= skinRange) {
            skinMask = 1;
          } else if (hueDelta <= skinRange + skinFalloff) {
            skinMask = 1 - (hueDelta - skinRange) / skinFalloff;
          }
        }
        mask *= 1 - 0.6 * skinMask;
      }

      let adaptiveFactor = 1;
      if (adaptiveStrength > 0 && sampleCount > 0) {
        const mean = sumC / sampleCount;
        const variance = Math.max(0, (sumC2 / sampleCount) - (mean * mean));
        const adaptiveScale = lerp(420, 60, adaptiveStrength);
        adaptiveFactor = 1 / (1 + (variance / adaptiveScale));
      }

      const strengthA = clamp(strength * channelAMult * mask * adaptiveFactor, 0, 1);
      const strengthB = clamp(strength * channelBMult * mask * adaptiveFactor, 0, 1);

      let finalA = lerp(centerA, smoothedA, strengthA);
      let finalB = lerp(centerB, smoothedB, strengthB);
      const finalL = lerp(workL[center], centerL, lumaPreserve);

      if (chromaClamp > 0) {
        const baseAx = baseA[center];
        const baseBx = baseB[center];
        const deltaA = finalA - baseAx;
        const deltaB = finalB - baseBx;
        const deltaMag = Math.sqrt(deltaA * deltaA + deltaB * deltaB);
        const maxDelta = lerp(42, 6, chromaClamp);
        if (deltaMag > maxDelta && deltaMag > 0.0001) {
          const scale = maxDelta / deltaMag;
          finalA = baseAx + deltaA * scale;
          finalB = baseBx + deltaB * scale;
        }

        const baseC = Math.sqrt(baseAx * baseAx + baseBx * baseBx);
        const finalC = Math.sqrt(finalA * finalA + finalB * finalB);
        const minC = baseC * lerp(0.72, 0.95, chromaClamp);
        if (finalC < minC && finalC > 0.0001) {
          const scale = minC / finalC;
          finalA *= scale;
          finalB *= scale;
        }
      }

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

export function boostChromaArtifacts(original, smoothed, options = {}) {
  const boost = clamp(options.artifactBoost ?? 0, 0, 1);
  if (boost <= 0) return smoothed;

  const { width, height } = smoothed;
  const out = new Uint8ClampedArray(smoothed.data.length);
  const src = original.data;
  const dst = smoothed.data;
  const gain = 1 + boost * 3.5;

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const baseLab = rgbToLab(src[idx], src[idx + 1], src[idx + 2]);
    const smoothLab = rgbToLab(dst[idx], dst[idx + 1], dst[idx + 2]);
    const dA = (baseLab.A - smoothLab.A) * gain;
    const dB = (baseLab.B - smoothLab.B) * gain;
    const finalA = baseLab.A + dA;
    const finalB = baseLab.B + dB;
    const rgb = labToRgb(baseLab.L, finalA, finalB);
    out[idx] = rgb.r;
    out[idx + 1] = rgb.g;
    out[idx + 2] = rgb.b;
    out[idx + 3] = src[idx + 3];
  }

  return new ImageData(out, width, height);
}
