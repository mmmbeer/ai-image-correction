import { bilateralFilter } from './bilateral.js';
import { quantize } from './quantize.js';

export function smoothRegion(imgData, opts) {
  let out = bilateralFilter(imgData, opts);

  if (opts.quant > 0) {
    out = quantize(out, opts.quant);
  }

  return out;
}
