import { smoothRegion } from '../../smoothing/smoother.js';
import { boostChromaArtifacts } from '../../smoothing/chroma.js';
import {
  detectEdges,
  edgeMapToImageData,
  edgeMapToGrayscale,
  edgeMapToHeatmap,
  buildOutlineMap,
  expandEdgeMap
} from '../../smoothing/edges.js';
import { softenEdges } from '../../smoothing/edgeSoften.js';
import { clamp } from '../../utils/math.js';
import { formatRegion, formatZoom } from '../utils/region.js';
import { applyEdgePreserve, getOutlineColor } from '../processing/outline.js';

export function createPreviewRenderer({ dom, state, getBaseImageData, getSmoothingOptions, setPreviewActive, setPreviewStale, setBusy }) {
  function schedulePreviewRender() {
    if (!state.previewRegion || state.isRendering) {
      state.renderQueued = state.renderQueued || !!state.previewRegion;
      return;
    }

    state.isRendering = true;
    setBusy(dom, true);
    setTimeout(() => {
      renderPreview();
      setBusy(dom, false);
      state.isRendering = false;
      if (state.renderQueued) {
        state.renderQueued = false;
        schedulePreviewRender();
      }
    }, 0);
  }

  function renderPreview() {
    if (!state.imageLoaded || !state.previewRegion) return;

    const { previewCanvas, previewCanvasWrap, bufferCanvas, basePreviewCanvas, edgeCanvas } = dom.canvases;
    const { previewCtx, bufferCtx, basePreviewCtx, edgeCtx } = dom.contexts;
    const { pixelGridInput } = dom.inputs;
    const { previewSizeTag } = dom.elements;

    const { x, y, w, h } = state.previewRegion;
    const imgData = getBaseImageData(x, y, w, h);
    const options = getSmoothingOptions();
    let smoothed = smoothRegion(imgData, options);
    let edgeMap = null;
    let outlineMap = null;

    const edgesEnabled = options.edgeDetect;
    const needsEdgeMap = edgesEnabled && (
      options.edgePreserve > 0 ||
      options.edgeSoften > 0 ||
      options.edgeOverlay ||
      options.outlineOverlay ||
      options.edgeView !== 'result'
    );

    if (needsEdgeMap) {
      edgeMap = detectEdges(imgData, {
        smooth: options.edgeSmooth,
        kernel: options.edgeKernel,
        threshold: options.edgeThreshold,
        sensitivity: options.edgeSensitivity,
        preBlur: options.edgePreblur
      });
      if (options.edgeInfluence > 0) {
        edgeMap = expandEdgeMap(edgeMap, w, h, options.edgeInfluence);
      }
      if (options.edgePreserve > 0) {
        smoothed = applyEdgePreserve(imgData, smoothed, edgeMap, options.edgePreserve, options.edgeFalloff);
      }
    }
    if (edgeMap && options.edgeSoften > 0) {
      smoothed = softenEdges(smoothed, edgeMap, options.edgeSoften);
    }

    const needsOutline = edgeMap && (options.outlineOverlay || options.edgeView === 'outline');
    if (needsOutline) {
      outlineMap = buildOutlineMap(edgeMap, w, h, {
        threshold: options.outlineThreshold,
        mode: options.outlineMode,
        thickness: options.outlineThickness,
        thin: options.outlineThin
      });
    }

    let previewMode = options.previewMode || 'result';
    let displayResult = options.artifactBoost > 0
      ? boostChromaArtifacts(imgData, smoothed, options)
      : smoothed;

    let basePreviewData = imgData;
    if (options.edgeView !== 'result' && edgeMap) {
      if (options.edgeView === 'edges') {
        displayResult = edgeMapToGrayscale(edgeMap, w, h, { invert: true });
      } else if (options.edgeView === 'heatmap') {
        displayResult = edgeMapToHeatmap(edgeMap, w, h);
      } else if (options.edgeView === 'outline' && outlineMap) {
        displayResult = edgeMapToGrayscale(outlineMap, w, h, { invert: true });
      }
      basePreviewData = displayResult;
      previewMode = 'result';
    }

    basePreviewCanvas.width = w;
    basePreviewCanvas.height = h;
    basePreviewCtx.putImageData(basePreviewData, 0, 0);

    bufferCanvas.width = w;
    bufferCanvas.height = h;
    bufferCtx.putImageData(displayResult, 0, 0);

    const displayWidth = previewCanvasWrap.clientWidth || 1;
    const displayHeight = previewCanvasWrap.clientHeight || 1;
    const dpr = window.devicePixelRatio || 1;
    const baseScale = Math.min(displayWidth / w, displayHeight / h);
    const scale = baseScale * state.previewZoom;
    const scaledW = Math.max(1, Math.round(w * scale));
    const scaledH = Math.max(1, Math.round(h * scale));
    const targetWidth = Math.max(1, Math.floor(scaledW * dpr));
    const targetHeight = Math.max(1, Math.floor(scaledH * dpr));

    if (previewCanvas.width !== targetWidth || previewCanvas.height !== targetHeight) {
      previewCanvas.width = targetWidth;
      previewCanvas.height = targetHeight;
    }

    previewCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    previewCtx.imageSmoothingEnabled = false;
    previewCtx.clearRect(0, 0, scaledW, scaledH);

    previewCanvas.style.width = `${scaledW}px`;
    previewCanvas.style.height = `${scaledH}px`;
    if (previewMode === 'split') {
      const splitX = Math.round(scaledW * clamp(options.previewSplit ?? 0.5, 0, 1));
      previewCtx.drawImage(basePreviewCanvas, 0, 0, scaledW, scaledH);
      previewCtx.save();
      previewCtx.beginPath();
      previewCtx.rect(splitX, 0, scaledW - splitX, scaledH);
      previewCtx.clip();
      previewCtx.drawImage(bufferCanvas, 0, 0, scaledW, scaledH);
      previewCtx.restore();
      drawSplitMarker(previewCtx, splitX, scaledH);
    } else if (previewMode === 'ab') {
      if (state.previewABState === 'A') {
        previewCtx.drawImage(basePreviewCanvas, 0, 0, scaledW, scaledH);
      } else {
        previewCtx.drawImage(bufferCanvas, 0, 0, scaledW, scaledH);
      }
    } else {
      previewCtx.drawImage(bufferCanvas, 0, 0, scaledW, scaledH);
    }

    if (edgeMap && (options.edgeOverlay || options.outlineOverlay) && options.edgeView === 'result') {
      const overlayMode = options.edgeOverlayMode || 'both';
      const opacity = clamp(options.edgeOverlayOpacity ?? 0.75, 0, 1);
      const showEdges = options.edgeOverlay && (overlayMode === 'edges' || overlayMode === 'both');
      const showOutlines = options.outlineOverlay && (overlayMode === 'outlines' || overlayMode === 'both');

      edgeCanvas.width = w;
      edgeCanvas.height = h;

      if (showEdges) {
        const overlay = edgeMapToImageData(edgeMap, w, h, { opacity });
        edgeCtx.putImageData(overlay, 0, 0);
        previewCtx.drawImage(edgeCanvas, 0, 0, scaledW, scaledH);
      }

      if (showOutlines && outlineMap) {
        const color = getOutlineColor(options.outlineColor);
        const overlay = edgeMapToImageData(outlineMap, w, h, { opacity, color });
        edgeCtx.putImageData(overlay, 0, 0);
        previewCtx.drawImage(edgeCanvas, 0, 0, scaledW, scaledH);
      }
    }

    if (pixelGridInput.checked && scale >= 2) {
      drawPixelGrid(previewCtx, scaledW, scaledH, scale, 0, 0, scaledW, scaledH);
    }

    previewSizeTag.textContent = `${formatRegion(state.previewRegion)} | ${formatZoom(state.previewZoom)}x`;
    setPreviewActive(dom, true);
    setPreviewStale(dom, state, false);
  }

  return { schedulePreviewRender, renderPreview };
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

function drawPixelGrid(ctx, width, height, zoom, offsetX, offsetY, drawW, drawH) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();

  const startX = offsetX;
  const startY = offsetY;
  const endX = offsetX + drawW;
  const endY = offsetY + drawH;

  for (let x = startX; x <= endX; x += zoom) {
    ctx.moveTo(x + 0.5, startY);
    ctx.lineTo(x + 0.5, endY);
  }
  for (let y = startY; y <= endY; y += zoom) {
    ctx.moveTo(startX, y + 0.5);
    ctx.lineTo(endX, y + 0.5);
  }

  ctx.stroke();
  ctx.restore();
}
