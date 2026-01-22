import { bilateralFilter } from './bilateral.js';
import { quantize } from './quantize.js';
import { smoothChroma } from './chroma.js';
import { simplifyPalette } from './palette.js';

export function smoothRegion(imgData, opts) {
  const mode = opts.smoothingMode || 'lab';
  let out = imgData;

  if (mode === 'rgb') {
    out = bilateralFilter(imgData, opts);
  }

  if (mode !== 'rgb' && opts.chromaSmooth > 0) {
    out = smoothChroma(out, imgData, opts);
  }

  if (opts.quant > 0) {
    out = quantize(out, opts.quant);
  }

  if ((opts.paletteLevels || 0) > 1 || (opts.neighborMerge || 0) > 0) {
    out = simplifyPalette(out, opts);
  }

  return out;
}
