import { bilateralFilter } from './bilateral.js';
import { quantize } from './quantize.js';
import { smoothChroma } from './chroma.js';
import { simplifyPalette } from './palette.js';

export function smoothRegion(imgData, opts) {
  let out = bilateralFilter(imgData, opts);

  if (opts.chromaSmooth > 0) {
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
