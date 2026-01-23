import { clamp } from '../../utils/math.js';
import { clampRegion, getCanvasMetrics } from '../utils/region.js';

export function getFixedSize(dom) {
  const { previewAutoSizeInput, previewWidthInput, previewHeightInput } = dom.inputs;
  if (previewAutoSizeInput.checked) {
    return getAutoFixedSize(dom);
  }

  const maxW = dom.canvases.fullCanvas.width || 2048;
  const maxH = dom.canvases.fullCanvas.height || 2048;
  const w = clamp(parseInt(previewWidthInput.value, 10) || 160, 16, maxW);
  const h = clamp(parseInt(previewHeightInput.value, 10) || 160, 16, maxH);
  return { w, h };
}

export function getAutoFixedSize(dom) {
  const maxW = dom.canvases.fullCanvas.width || 2048;
  const maxH = dom.canvases.fullCanvas.height || 2048;
  const displayW = Math.max(1, dom.canvases.previewCanvas.clientWidth || 1);
  const displayH = Math.max(1, dom.canvases.previewCanvas.clientHeight || 1);
  const baseH = clamp(Math.round(displayH), 16, maxH);
  const ratio = displayW / displayH;
  const baseW = clamp(Math.round(baseH * ratio), 16, maxW);
  return { w: baseW, h: baseH };
}

export function getAspectRatio(dom) {
  const size = getFixedSize(dom);
  if (!size.w || !size.h) return 1;
  return size.w / size.h;
}

export function setPreviewZoom(dom, state, zoom, schedulePreviewRender) {
  const { zoomButtons, pixelGridInput } = dom.inputs;
  state.previewZoom = clamp(zoom, 0.5, 8);
  zoomButtons.forEach(button => {
    const target = Number(button.dataset.zoom);
    button.classList.toggle('is-active', Math.abs(target - state.previewZoom) < 0.05);
  });

  if (state.previewZoom < 2) {
    pixelGridInput.checked = false;
    pixelGridInput.disabled = true;
  } else {
    pixelGridInput.disabled = false;
  }

  if (state.previewRegion) schedulePreviewRender();
}

export function adjustPreviewZoom(dom, state, deltaY, schedulePreviewRender) {
  const step = 0.1;
  const direction = deltaY > 0 ? -1 : 1;
  const next = state.previewZoom + direction * step;
  setPreviewZoom(dom, state, next, schedulePreviewRender);
}

export function adjustFullZoom(dom, state, deltaY, updateFullCanvasScale, updateActivePreviewBox) {
  const step = 0.1;
  const direction = deltaY > 0 ? -1 : 1;
  state.fullZoom = clamp(state.fullZoom + direction * step, 0.5, 6);
  updateFullCanvasScale(dom, state);
  updateActivePreviewBox(dom, state);
}

export function updateFullCanvasScale(dom, state) {
  if (!state.imageLoaded) return;
  const { fullCanvas } = dom.canvases;
  const baseScale = getFullBaseScale(dom);
  const scale = baseScale * state.fullZoom;
  fullCanvas.style.width = `${Math.max(1, Math.round(fullCanvas.width * scale))}px`;
  fullCanvas.style.height = `${Math.max(1, Math.round(fullCanvas.height * scale))}px`;
}

export function getFullBaseScale(dom) {
  const { fullCanvas, fullImage } = dom.canvases;
  const w = Math.max(1, fullImage.clientWidth || 1);
  const h = Math.max(1, fullImage.clientHeight || 1);
  return Math.min(w / fullCanvas.width, h / fullCanvas.height);
}

export function updatePreviewRegionForFixedSize(dom, state) {
  if (!state.previewRegion || dom.inputs.selectionMode.value !== 'fixed') return;
  const size = getFixedSize(dom);
  const centerX = state.previewRegion.x + state.previewRegion.w / 2;
  const centerY = state.previewRegion.y + state.previewRegion.h / 2;
  state.previewRegion = clampRegion({
    x: Math.round(centerX - size.w / 2),
    y: Math.round(centerY - size.h / 2),
    w: size.w,
    h: size.h
  }, dom.canvases.fullCanvas.width, dom.canvases.fullCanvas.height);
  updateActivePreviewBox(dom, state);
}

export function syncPreviewSizeToImage(dom, state) {
  if (!state.imageLoaded) return;
  const current = getFixedSize(dom);
  const w = Math.min(current.w, dom.canvases.fullCanvas.width);
  const h = Math.min(current.h, dom.canvases.fullCanvas.height);
  dom.inputs.previewWidthInput.value = w;
  dom.inputs.previewHeightInput.value = h;
}

export function updateActivePreviewBox(dom, state) {
  const { activePreviewBox } = dom.canvases;
  if (!state.previewRegion) {
    activePreviewBox.style.display = 'none';
    return;
  }

  const metrics = getCanvasMetrics(dom.canvases.fullCanvas);
  const scaleX = metrics.scale;
  const scaleY = metrics.scale;

  activePreviewBox.style.display = 'block';
  activePreviewBox.style.left = `${metrics.offsetX + state.previewRegion.x * scaleX}px`;
  activePreviewBox.style.top = `${metrics.offsetY + state.previewRegion.y * scaleY}px`;
  activePreviewBox.style.width = `${state.previewRegion.w * scaleX}px`;
  activePreviewBox.style.height = `${state.previewRegion.h * scaleY}px`;
}
