export function getBaseImageData(dom, state, x, y, w, h) {
  const { baseCanvas } = dom.canvases;
  if (state.baseReady && baseCanvas.width && baseCanvas.height) {
    return dom.contexts.baseCtx.getImageData(x, y, w, h);
  }
  return dom.contexts.fullCtx.getImageData(x, y, w, h);
}
