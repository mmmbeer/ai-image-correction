import { smoothRegion } from '../../smoothing/smoother.js';
import {
  detectEdges,
  buildOutlineMap,
  expandEdgeMap
} from '../../smoothing/edges.js';
import { softenEdges } from '../../smoothing/edgeSoften.js';
import { clamp } from '../../utils/math.js';
import { applyEdgePreserve, applyOutlineMerge } from '../processing/outline.js';

export function createFullRenderer({
  dom,
  state,
  getBaseImageData,
  getSmoothingOptions,
  setPreviewStale,
  setBusy,
  updateFullABToggle,
  updateFullCompareControls
}) {
  function applyFullImage() {
    if (!state.imageLoaded) return;
    setBusy(dom, true);
    setTimeout(() => {
      const { fullCanvas, tunedCanvas } = dom.canvases;
      const { tunedCtx } = dom.contexts;
      const img = getBaseImageData(0, 0, fullCanvas.width, fullCanvas.height);
      const options = getSmoothingOptions();
      options.artifactBoost = 0;
      let smoothed = smoothRegion(img, options);

      const edgesEnabled = options.edgeDetect;
      const needsEdges = edgesEnabled && (options.edgePreserve > 0 || options.edgeSoften > 0 || options.outlineMerge);
      let edgeMap = needsEdges
        ? detectEdges(img, {
          smooth: options.edgeSmooth,
          kernel: options.edgeKernel,
          threshold: options.edgeThreshold,
          sensitivity: options.edgeSensitivity,
          preBlur: options.edgePreblur
        })
        : null;

      if (edgeMap && options.edgeInfluence > 0) {
        edgeMap = expandEdgeMap(edgeMap, img.width, img.height, options.edgeInfluence);
      }
      if (edgeMap && options.edgePreserve > 0) {
        smoothed = applyEdgePreserve(img, smoothed, edgeMap, options.edgePreserve, options.edgeFalloff);
      }
      if (edgeMap && options.edgeSoften > 0) {
        smoothed = softenEdges(smoothed, edgeMap, options.edgeSoften);
      }
      if (edgeMap && options.outlineMerge) {
        const outlineMap = buildOutlineMap(edgeMap, img.width, img.height, {
          threshold: options.outlineThreshold,
          mode: options.outlineMode,
          thickness: options.outlineThickness,
          thin: options.outlineThin
        });
        smoothed = applyOutlineMerge(smoothed, outlineMap, options);
      }

      tunedCanvas.width = fullCanvas.width;
      tunedCanvas.height = fullCanvas.height;
      tunedCtx.putImageData(smoothed, 0, 0);
      state.tunedReady = true;
      state.fullABState = 'B';
      updateFullABToggle(dom, state);
      updateFullCompareControls(dom, state);
      renderFullCompareView();
      setPreviewStale(dom, state, true);
      setBusy(dom, false);

    }, 0);
  }

  function renderFullCompareView() {
    if (!state.imageLoaded) return;
    if (!state.tunedReady) return;
    const { fullCanvas, baseCanvas, tunedCanvas } = dom.canvases;
    const { fullCtx } = dom.contexts;
    const { fullCompareMode, fullSplitRange } = dom.inputs;
    const mode = fullCompareMode.value || 'ab';
    fullCtx.clearRect(0, 0, fullCanvas.width, fullCanvas.height);

    if (mode === 'split') {
      const splitRatio = clamp(parseInt(fullSplitRange.value, 10) || 50, 0, 100) / 100;
      const splitX = Math.round(fullCanvas.width * splitRatio);
      fullCtx.drawImage(baseCanvas, 0, 0);
      fullCtx.save();
      fullCtx.beginPath();
      fullCtx.rect(splitX, 0, fullCanvas.width - splitX, fullCanvas.height);
      fullCtx.clip();
      fullCtx.drawImage(tunedCanvas, 0, 0);
      fullCtx.restore();
      drawSplitMarker(fullCtx, splitX, fullCanvas.height);
    } else if (state.fullABState === 'A') {
      fullCtx.drawImage(baseCanvas, 0, 0);
    } else {
      fullCtx.drawImage(tunedCanvas, 0, 0);
    }
  }

  return { applyFullImage, renderFullCompareView };
}

function drawSplitMarker(ctx, splitX, height) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(splitX + 0.5, 0);
  ctx.lineTo(splitX + 0.5, height);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(splitX - 6, Math.max(0, height / 2 - 14), 12, 28);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.strokeRect(splitX - 6, Math.max(0, height / 2 - 14), 12, 28);
  ctx.restore();
}
