import { loadImage } from './imageLoader.js';
import { initPreviewSelector } from './previewSelector.js';
import { smoothRegion } from './smoothing/smoother.js';
import { clamp } from './utils/math.js';

const fullCanvas = document.getElementById('fullCanvas');
const previewCanvas = document.getElementById('previewCanvas');
const previewBox = document.getElementById('previewBox');
const activePreviewBox = document.getElementById('activePreviewBox');

const fullCtx = fullCanvas.getContext('2d', { willReadFrequently: true });
const previewCtx = previewCanvas.getContext('2d');
const bufferCanvas = document.createElement('canvas');
const bufferCtx = bufferCanvas.getContext('2d', { willReadFrequently: true });

const previewPanel = document.querySelector('.preview-panel');
const previewActiveBadge = document.getElementById('previewActiveBadge');
const previewStaleBadge = document.getElementById('previewStaleBadge');
const previewSizeTag = document.getElementById('previewSizeTag');

const selectionMode = document.getElementById('selectionMode');
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

const resetPreviewButton = document.getElementById('resetPreview');
const applyFullButton = document.getElementById('applyFull');

let imageLoaded = false;
let previewRegion = null;
let previewZoom = 1;
let previewStale = false;
let isRendering = false;
let renderQueued = false;

document.getElementById('upload').onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  loadImage(file, fullCanvas, fullCtx).then(() => {
    imageLoaded = true;
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

selectionMode.addEventListener('change', () => {
  toggleFixedInputs();
});

previewWidthInput.addEventListener('input', handleSettingsChange);
previewHeightInput.addEventListener('input', handleSettingsChange);
aspectLockInput.addEventListener('change', handleSettingsChange);
pixelGridInput.addEventListener('change', () => {
  if (previewRegion) schedulePreviewRender();
});

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
    const img = fullCtx.getImageData(0, 0, fullCanvas.width, fullCanvas.height);
    const smoothed = smoothRegion(img, getSmoothingOptions());
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
  if (!previewRegion) return;
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
    quant: 0
  };
}

function getFixedSize() {
  const maxW = fullCanvas.width || 2048;
  const maxH = fullCanvas.height || 2048;
  const w = clamp(parseInt(previewWidthInput.value, 10) || 160, 16, maxW);
  const h = clamp(parseInt(previewHeightInput.value, 10) || 160, 16, maxH);
  return { w, h };
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
  const disabled = selectionMode.value !== 'fixed';
  previewWidthInput.disabled = disabled;
  previewHeightInput.disabled = disabled;
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
  const imgData = fullCtx.getImageData(x, y, w, h);
  const smoothed = smoothRegion(imgData, getSmoothingOptions());

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

function formatRegion(region) {
  return `Region ${region.w}x${region.h} at ${region.x},${region.y}`;
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

  const rect = fullCanvas.getBoundingClientRect();
  const scaleX = rect.width ? rect.width / fullCanvas.width : 1;
  const scaleY = rect.height ? rect.height / fullCanvas.height : 1;

  activePreviewBox.style.display = 'block';
  activePreviewBox.style.left = `${previewRegion.x * scaleX}px`;
  activePreviewBox.style.top = `${previewRegion.y * scaleY}px`;
  activePreviewBox.style.width = `${previewRegion.w * scaleX}px`;
  activePreviewBox.style.height = `${previewRegion.h * scaleY}px`;
}

function setBusy(busy) {
  previewPanel.classList.toggle('is-busy', busy);
  applyFullButton.disabled = busy;
  resetPreviewButton.disabled = busy;
}
