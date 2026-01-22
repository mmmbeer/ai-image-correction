import { loadImage } from './imageLoader.js';
import { initPreviewSelector } from './previewSelector.js';
import { smoothRegion } from './smoothing/smoother.js';
import { detectEdges, edgeMapToImageData } from './smoothing/edges.js';
import { clamp } from './utils/math.js';

const fullCanvas = document.getElementById('fullCanvas');
const previewCanvas = document.getElementById('previewCanvas');
const previewBox = document.getElementById('previewBox');
const activePreviewBox = document.getElementById('activePreviewBox');

const fullCtx = fullCanvas.getContext('2d', { willReadFrequently: true });
const previewCtx = previewCanvas.getContext('2d');
const bufferCanvas = document.createElement('canvas');
const bufferCtx = bufferCanvas.getContext('2d', { willReadFrequently: true });
const edgeCanvas = document.createElement('canvas');
const edgeCtx = edgeCanvas.getContext('2d');
const baseCanvas = document.createElement('canvas');
const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });

const previewPanel = document.querySelector('.preview-panel');
const previewActiveBadge = document.getElementById('previewActiveBadge');
const previewStaleBadge = document.getElementById('previewStaleBadge');
const previewSizeTag = document.getElementById('previewSizeTag');
const previewSettingsToggle = document.getElementById('previewSettingsToggle');
const previewSettings = document.getElementById('previewSettings');

const selectionMode = document.getElementById('selectionMode');
const previewAutoSizeInput = document.getElementById('previewAutoSize');
const previewWidthInput = document.getElementById('previewWidth');
const previewHeightInput = document.getElementById('previewHeight');
const aspectLockInput = document.getElementById('previewAspectLock');
const zoomButtons = document.querySelectorAll('#previewZoom button');
const pixelGridInput = document.getElementById('previewPixelGrid');
const controlSliders = document.querySelectorAll('.controls input[type="range"], .controls input[type="number"]');

const radiusNumber = document.getElementById('radiusNumber');
const radiusRange = document.getElementById('radiusRange');
const sigmaColorNumber = document.getElementById('sigmaColorNumber');
const sigmaColorRange = document.getElementById('sigmaColorRange');

const edgeDetectInput = document.getElementById('edgeDetect');
const edgeOverlayInput = document.getElementById('edgeOverlay');
const edgeStrengthNumber = document.getElementById('edgeStrengthNumber');
const edgeStrengthRange = document.getElementById('edgeStrengthRange');
const edgeSmoothNumber = document.getElementById('edgeSmoothNumber');
const edgeSmoothRange = document.getElementById('edgeSmoothRange');

const resetPreviewButton = document.getElementById('resetPreview');
const applyFullButton = document.getElementById('applyFull');

let imageLoaded = false;
let previewRegion = null;
let previewZoom = 1;
let previewStale = false;
let isRendering = false;
let renderQueued = false;
let baseReady = false;

document.getElementById('upload').onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  loadImage(file, fullCanvas, fullCtx).then(() => {
    imageLoaded = true;
    baseReady = true;
    baseCanvas.width = fullCanvas.width;
    baseCanvas.height = fullCanvas.height;
    baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
    baseCtx.drawImage(fullCanvas, 0, 0);
    previewRegion = null;
    setPreviewActive(false);
    setPreviewStale(false);
    previewSizeTag.textContent = 'No selection';
    updateActivePreviewBox();
    syncPreviewSizeToImage();
  });
};

bindRangeNumber(radiusRange, radiusNumber, handleSmoothingChange);
bindRangeNumber(sigmaColorRange, sigmaColorNumber, handleSmoothingChange);
bindRangeNumber(edgeStrengthRange, edgeStrengthNumber, handleSmoothingChange);
bindRangeNumber(edgeSmoothRange, edgeSmoothNumber, handleSmoothingChange);

previewSettingsToggle.addEventListener('click', e => {
  e.stopPropagation();
  const isOpen = previewSettings.classList.toggle('is-open');
  previewSettingsToggle.setAttribute('aria-expanded', String(isOpen));
});

document.addEventListener('click', e => {
  if (!previewSettings.classList.contains('is-open')) return;
  if (previewSettings.contains(e.target) || previewSettingsToggle.contains(e.target)) return;
  previewSettings.classList.remove('is-open');
  previewSettingsToggle.setAttribute('aria-expanded', 'false');
});

selectionMode.addEventListener('change', () => {
  toggleFixedInputs();
  handleSettingsChange();
});

previewWidthInput.addEventListener('input', handleSettingsChange);
previewHeightInput.addEventListener('input', handleSettingsChange);
aspectLockInput.addEventListener('change', handleSettingsChange);
previewAutoSizeInput.addEventListener('change', () => {
  toggleFixedInputs();
  handleSettingsChange();
});
pixelGridInput.addEventListener('change', () => {
  if (previewRegion) schedulePreviewRender();
});

edgeDetectInput.addEventListener('change', handleSmoothingChange);
edgeOverlayInput.addEventListener('change', handleSmoothingChange);

zoomButtons.forEach(button => {
  button.addEventListener('click', () => {
    setPreviewZoom(Number(button.dataset.zoom));
  });
});

resetPreviewButton.addEventListener('click', () => {
  previewRegion = null;
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  setPreviewActive(false);
  setPreviewStale(false);
  previewSizeTag.textContent = 'No selection';
  updateActivePreviewBox();
});

controlSliders.forEach(input => {
  if (input.id === 'previewWidth' || input.id === 'previewHeight') return;
  input.addEventListener('input', handleSmoothingChange);
});

applyFullButton.addEventListener('click', () => {
  if (!imageLoaded) return;
  setBusy(true);
  setTimeout(() => {
    const img = getBaseImageData(0, 0, fullCanvas.width, fullCanvas.height);
    const options = getSmoothingOptions();
    let smoothed = smoothRegion(img, options);

    if (options.edgeDetect && options.edgePreserve > 0) {
      const edgeMap = detectEdges(img, { smooth: options.edgeSmooth });
      smoothed = applyEdgePreserve(img, smoothed, edgeMap, options.edgePreserve);
    }

    fullCtx.putImageData(smoothed, 0, 0);
    setPreviewStale(true);
    setBusy(false);
  }, 0);
});

initPreviewSelector({
  canvas: fullCanvas,
  previewBox,
  isEnabled: () => imageLoaded,
  getMode: () => selectionMode.value,
  getFixedSize: getFixedSize,
  isAspectLocked: () => aspectLockInput.checked,
  getAspectRatio: getAspectRatio,
  onHover: region => {
    if (!region) return;
    if (!previewRegion) {
      previewSizeTag.textContent = formatRegion(region);
    }
  },
  onSelect: region => {
    previewRegion = region;
    updateActivePreviewBox();
    schedulePreviewRender();
  }
});

setPreviewZoom(1);
toggleFixedInputs();
setPreviewActive(false);
setPreviewStale(false);

window.addEventListener('resize', () => {
  if (previewAutoSizeInput.checked) {
    syncPreviewSizeToImage();
    updatePreviewRegionForFixedSize();
  }
  updateActivePreviewBox();
  if (previewRegion) schedulePreviewRender();
});

function bindRangeNumber(rangeInput, numberInput, onChange) {
  rangeInput.addEventListener('input', () => {
    numberInput.value = rangeInput.value;
    onChange();
  });
  numberInput.addEventListener('input', () => {
    rangeInput.value = numberInput.value;
    onChange();
  });
}

function handleSettingsChange() {
  if (previewAutoSizeInput.checked) {
    syncPreviewSizeToImage();
  }

  if (!previewRegion) return;

  if (selectionMode.value === 'fixed') {
    updatePreviewRegionForFixedSize();
    schedulePreviewRender();
    return;
  }

  setPreviewStale(true);
}

function handleSmoothingChange() {
  if (!previewRegion) return;
  schedulePreviewRender();
}

function getSmoothingOptions() {
  return {
    radius: clamp(parseInt(radiusNumber.value, 10) || 3, 1, 12),
    sigmaColor: clamp(parseInt(sigmaColorNumber.value, 10) || 30, 1, 200),
    sigmaSpace: 4,
    quant: 0,
    edgeDetect: !!edgeDetectInput.checked,
    edgeOverlay: !!edgeOverlayInput.checked,
    edgePreserve: clamp(parseInt(edgeStrengthNumber.value, 10) || 0, 0, 100) / 100,
    edgeSmooth: clamp(parseInt(edgeSmoothNumber.value, 10) || 0, 0, 3)
  };
}

function getFixedSize() {
  if (previewAutoSizeInput.checked) {
    return getAutoFixedSize();
  }

  const maxW = fullCanvas.width || 2048;
  const maxH = fullCanvas.height || 2048;
  const w = clamp(parseInt(previewWidthInput.value, 10) || 160, 16, maxW);
  const h = clamp(parseInt(previewHeightInput.value, 10) || 160, 16, maxH);
  return { w, h };
}

function getAutoFixedSize() {
  const maxW = fullCanvas.width || 2048;
  const maxH = fullCanvas.height || 2048;
  const displayW = Math.max(1, previewCanvas.clientWidth || 1);
  const displayH = Math.max(1, previewCanvas.clientHeight || 1);
  const baseH = clamp(Math.round(displayH), 16, maxH);
  const ratio = displayW / displayH;
  const baseW = clamp(Math.round(baseH * ratio), 16, maxW);
  return { w: baseW, h: baseH };
}

function getAspectRatio() {
  const size = getFixedSize();
  if (!size.w || !size.h) return 1;
  return size.w / size.h;
}

function setPreviewZoom(zoom) {
  previewZoom = zoom;
  zoomButtons.forEach(button => {
    button.classList.toggle('is-active', Number(button.dataset.zoom) === zoom);
  });

  if (zoom < 2) {
    pixelGridInput.checked = false;
    pixelGridInput.disabled = true;
  } else {
    pixelGridInput.disabled = false;
  }

  if (previewRegion) schedulePreviewRender();
}

function toggleFixedInputs() {
  const isFixed = selectionMode.value === 'fixed';
  const customSize = !previewAutoSizeInput.checked;
  previewWidthInput.disabled = !isFixed || !customSize;
  previewHeightInput.disabled = !isFixed || !customSize;
  aspectLockInput.disabled = selectionMode.value !== 'drag';
}

function schedulePreviewRender() {
  if (!previewRegion || isRendering) {
    renderQueued = renderQueued || !!previewRegion;
    return;
  }

  isRendering = true;
  setBusy(true);
  setTimeout(() => {
    renderPreview();
    setBusy(false);
    isRendering = false;
    if (renderQueued) {
      renderQueued = false;
      schedulePreviewRender();
    }
  }, 0);
}

function renderPreview() {
  if (!imageLoaded || !previewRegion) return;

  const { x, y, w, h } = previewRegion;
  const imgData = getBaseImageData(x, y, w, h);
  const options = getSmoothingOptions();
  let smoothed = smoothRegion(imgData, options);
  let edgeMap = null;

  if (options.edgeDetect) {
    edgeMap = detectEdges(imgData, { smooth: options.edgeSmooth });
    if (options.edgePreserve > 0) {
      smoothed = applyEdgePreserve(imgData, smoothed, edgeMap, options.edgePreserve);
    }
  }

  bufferCanvas.width = w;
  bufferCanvas.height = h;
  bufferCtx.putImageData(smoothed, 0, 0);

  const displayWidth = previewCanvas.clientWidth || 1;
  const displayHeight = previewCanvas.clientHeight || 1;
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = Math.max(1, Math.floor(displayWidth * dpr));
  const targetHeight = Math.max(1, Math.floor(displayHeight * dpr));

  if (previewCanvas.width !== targetWidth || previewCanvas.height !== targetHeight) {
    previewCanvas.width = targetWidth;
    previewCanvas.height = targetHeight;
  }

  previewCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  previewCtx.imageSmoothingEnabled = false;
  previewCtx.clearRect(0, 0, displayWidth, displayHeight);

  const baseScale = Math.min(displayWidth / w, displayHeight / h);
  const scale = baseScale * previewZoom;
  const drawW = w * scale;
  const drawH = h * scale;
  const offsetX = Math.max(0, (displayWidth - drawW) / 2);
  const offsetY = Math.max(0, (displayHeight - drawH) / 2);

  previewCtx.drawImage(bufferCanvas, offsetX, offsetY, drawW, drawH);

  if (edgeMap && options.edgeOverlay) {
    edgeCanvas.width = w;
    edgeCanvas.height = h;
    const overlay = edgeMapToImageData(edgeMap, w, h, { opacity: 0.75 });
    edgeCtx.putImageData(overlay, 0, 0);
    previewCtx.drawImage(edgeCanvas, offsetX, offsetY, drawW, drawH);
  }

  const gridScale = scale;
  if (pixelGridInput.checked && gridScale >= 2) {
    drawPixelGrid(previewCtx, displayWidth, displayHeight, gridScale, offsetX, offsetY, drawW, drawH);
  }

  previewSizeTag.textContent = `${formatRegion(previewRegion)} | ${previewZoom}x`;
  setPreviewActive(true);
  setPreviewStale(false);
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

function applyEdgePreserve(original, smoothed, edgeMap, strength) {
  if (!edgeMap || strength <= 0) return smoothed;
  const out = new ImageData(new Uint8ClampedArray(smoothed.data.length), smoothed.width, smoothed.height);
  const src = smoothed.data;
  const base = original.data;
  const dst = out.data;
  const k = Math.max(0, Math.min(1, strength));

  for (let i = 0; i < edgeMap.length; i++) {
    const edge = edgeMap[i] * k;
    const keep = edge;
    const mix = 1 - keep;
    const idx = i * 4;
    dst[idx] = src[idx] * mix + base[idx] * keep;
    dst[idx + 1] = src[idx + 1] * mix + base[idx + 1] * keep;
    dst[idx + 2] = src[idx + 2] * mix + base[idx + 2] * keep;
    dst[idx + 3] = base[idx + 3];
  }

  return out;
}

function formatRegion(region) {
  return `Region ${region.w}x${region.h} at ${region.x},${region.y}`;
}

function updatePreviewRegionForFixedSize() {
  if (!previewRegion || selectionMode.value !== 'fixed') return;
  const size = getFixedSize();
  const centerX = previewRegion.x + previewRegion.w / 2;
  const centerY = previewRegion.y + previewRegion.h / 2;
  previewRegion = clampRegion({
    x: Math.round(centerX - size.w / 2),
    y: Math.round(centerY - size.h / 2),
    w: size.w,
    h: size.h
  }, fullCanvas.width, fullCanvas.height);
  updateActivePreviewBox();
}

function syncPreviewSizeToImage() {
  if (!imageLoaded) return;
  const current = getFixedSize();
  const w = Math.min(current.w, fullCanvas.width);
  const h = Math.min(current.h, fullCanvas.height);
  previewWidthInput.value = w;
  previewHeightInput.value = h;
}

function setPreviewActive(active) {
  previewPanel.classList.toggle('is-active', active);
  previewActiveBadge.textContent = active ? 'Preview Active' : 'Preview Inactive';
  previewActiveBadge.classList.toggle('badge-success', active);
  previewActiveBadge.classList.toggle('badge-danger', !active);
}

function setPreviewStale(stale) {
  previewStale = stale;
  previewStaleBadge.style.display = stale && previewRegion ? 'inline-flex' : 'none';
}

function updateActivePreviewBox() {
  if (!previewRegion) {
    activePreviewBox.style.display = 'none';
    return;
  }

  const metrics = getCanvasMetrics(fullCanvas);
  const scaleX = metrics.scale;
  const scaleY = metrics.scale;

  activePreviewBox.style.display = 'block';
  activePreviewBox.style.left = `${metrics.offsetX + previewRegion.x * scaleX}px`;
  activePreviewBox.style.top = `${metrics.offsetY + previewRegion.y * scaleY}px`;
  activePreviewBox.style.width = `${previewRegion.w * scaleX}px`;
  activePreviewBox.style.height = `${previewRegion.h * scaleY}px`;
}

function clampRegion(region, maxW, maxH) {
  const w = Math.max(1, Math.min(region.w, maxW));
  const h = Math.max(1, Math.min(region.h, maxH));
  const x = Math.max(0, Math.min(region.x, maxW - w));
  const y = Math.max(0, Math.min(region.y, maxH - h));

  return {
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(w),
    h: Math.round(h)
  };
}

function getBaseImageData(x, y, w, h) {
  if (baseReady && baseCanvas.width && baseCanvas.height) {
    return baseCtx.getImageData(x, y, w, h);
  }
  return fullCtx.getImageData(x, y, w, h);
}

function getCanvasMetrics(canvas) {
  const rect = canvas.getBoundingClientRect();
  const scale = rect.width && rect.height
    ? Math.min(rect.width / canvas.width, rect.height / canvas.height)
    : 1;
  const displayW = canvas.width * scale;
  const displayH = canvas.height * scale;
  const offsetX = (rect.width - displayW) / 2;
  const offsetY = (rect.height - displayH) / 2;
  return { scale, offsetX, offsetY };
}

function setBusy(busy) {
  previewPanel.classList.toggle('is-busy', busy);
  applyFullButton.disabled = busy;
  resetPreviewButton.disabled = busy;
}
