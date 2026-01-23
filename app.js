import { loadImage } from './imageLoader.js';
import { initPreviewSelector } from './previewSelector.js';
import { smoothRegion } from './smoothing/smoother.js';
import { boostChromaArtifacts } from './smoothing/chroma.js';
import {
  detectEdges,
  edgeMapToImageData,
  edgeMapToGrayscale,
  edgeMapToHeatmap,
  buildOutlineMap,
  expandEdgeMap
} from './smoothing/edges.js';
import { softenEdges } from './smoothing/edgeSoften.js';
import { clamp } from './utils/math.js';

const fullCanvas = document.getElementById('fullCanvas');
const previewCanvas = document.getElementById('previewCanvas');
const previewCanvasWrap = document.getElementById('previewCanvasWrap');
const previewBox = document.getElementById('previewBox');
const activePreviewBox = document.getElementById('activePreviewBox');
const fullImage = document.querySelector('.full-image');

const fullCtx = fullCanvas.getContext('2d', { willReadFrequently: true });
const previewCtx = previewCanvas.getContext('2d');
const bufferCanvas = document.createElement('canvas');
const bufferCtx = bufferCanvas.getContext('2d', { willReadFrequently: true });
const basePreviewCanvas = document.createElement('canvas');
const basePreviewCtx = basePreviewCanvas.getContext('2d');
const edgeCanvas = document.createElement('canvas');
const edgeCtx = edgeCanvas.getContext('2d');
const baseCanvas = document.createElement('canvas');
const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
const tunedCanvas = document.createElement('canvas');
const tunedCtx = tunedCanvas.getContext('2d', { willReadFrequently: true });

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
const controlToggles = document.querySelectorAll('.controls input[type="checkbox"], .controls select');

const radiusRange = document.getElementById('radiusRange');
const sigmaColorRange = document.getElementById('sigmaColorRange');
const smoothingModeInput = document.getElementById('smoothingMode');
const chromaPresetInput = document.getElementById('chromaPreset');
const lumaPreserveRange = document.getElementById('lumaPreserveRange');
const chromaSmoothRange = document.getElementById('chromaSmoothRange');
const chromaSmoothARange = document.getElementById('chromaSmoothARange');
const chromaSmoothBRange = document.getElementById('chromaSmoothBRange');
const chromaRadiusRange = document.getElementById('chromaRadiusRange');
const chromaSigmaSpaceRange = document.getElementById('chromaSigmaSpaceRange');
const chromaSigmaColorRange = document.getElementById('chromaSigmaColorRange');
const chromaClampRange = document.getElementById('chromaClampRange');
const neutralProtectRange = document.getElementById('neutralProtectRange');
const lumaProtectRange = document.getElementById('lumaProtectRange');
const adaptiveChromaRange = document.getElementById('adaptiveChromaRange');
const protectSkinInput = document.getElementById('protectSkin');
const artifactBoostRange = document.getElementById('artifactBoostRange');
const previewModeInput = document.getElementById('previewMode');
const previewSplitRange = document.getElementById('previewSplitRange');
const previewABToggle = document.getElementById('previewABToggle');
const labAdvancedToggle = document.getElementById('labAdvancedToggle');
const previewSplitControls = document.getElementById('previewSplitControls');
const previewABControls = document.getElementById('previewABControls');
const labAdvancedControls = document.getElementById('labAdvancedControls');
const fullCompareMode = document.getElementById('fullCompareMode');
const fullSplitControls = document.getElementById('fullSplitControls');
const fullSplitRange = document.getElementById('fullSplitRange');
const fullSplitValue = document.getElementById('fullSplitValue');
const fullABControls = document.getElementById('fullABControls');

const radiusValue = document.getElementById('radiusValue');
const sigmaColorValue = document.getElementById('sigmaColorValue');
const lumaPreserveValue = document.getElementById('lumaPreserveValue');
const chromaSmoothValue = document.getElementById('chromaSmoothValue');
const chromaSmoothAValue = document.getElementById('chromaSmoothAValue');
const chromaSmoothBValue = document.getElementById('chromaSmoothBValue');
const chromaRadiusValue = document.getElementById('chromaRadiusValue');
const chromaSigmaSpaceValue = document.getElementById('chromaSigmaSpaceValue');
const chromaSigmaColorValue = document.getElementById('chromaSigmaColorValue');
const chromaClampValue = document.getElementById('chromaClampValue');
const neutralProtectValue = document.getElementById('neutralProtectValue');
const lumaProtectValue = document.getElementById('lumaProtectValue');
const adaptiveChromaValue = document.getElementById('adaptiveChromaValue');
const artifactBoostValue = document.getElementById('artifactBoostValue');
const previewSplitValue = document.getElementById('previewSplitValue');
const paletteLevelsValue = document.getElementById('paletteLevelsValue');
const neighborMergeValue = document.getElementById('neighborMergeValue');
const edgeStrengthValue = document.getElementById('edgeStrengthValue');
const edgeSmoothValue = document.getElementById('edgeSmoothValue');
const edgeSoftenValue = document.getElementById('edgeSoftenValue');
const edgeSensitivityValue = document.getElementById('edgeSensitivityValue');
const edgeThresholdValue = document.getElementById('edgeThresholdValue');
const edgePreblurValue = document.getElementById('edgePreblurValue');
const edgeInfluenceValue = document.getElementById('edgeInfluenceValue');
const edgeOverlayOpacityValue = document.getElementById('edgeOverlayOpacityValue');
const outlineThresholdValue = document.getElementById('outlineThresholdValue');
const outlineThicknessValue = document.getElementById('outlineThicknessValue');
const outlineMergeStrengthValue = document.getElementById('outlineMergeStrengthValue');
const paletteLevelsRange = document.getElementById('paletteLevelsRange');
const neighborMergeRange = document.getElementById('neighborMergeRange');

const edgeDetectInput = document.getElementById('edgeDetect');
const edgeOverlayInput = document.getElementById('edgeOverlay');
const outlineOverlayInput = document.getElementById('outlineOverlay');
const edgeKernelInput = document.getElementById('edgeKernel');
const edgeSensitivityRange = document.getElementById('edgeSensitivityRange');
const edgeThresholdRange = document.getElementById('edgeThresholdRange');
const edgePreblurRange = document.getElementById('edgePreblurRange');
const edgeInfluenceRange = document.getElementById('edgeInfluenceRange');
const edgeFalloffInput = document.getElementById('edgeFalloff');
const edgeOverlayModeInput = document.getElementById('edgeOverlayMode');
const edgeOverlayOpacityRange = document.getElementById('edgeOverlayOpacityRange');
const edgeViewInput = document.getElementById('edgeView');
const outlineModeInput = document.getElementById('outlineMode');
const outlineThresholdRange = document.getElementById('outlineThresholdRange');
const outlineThicknessRange = document.getElementById('outlineThicknessRange');
const outlineThinInput = document.getElementById('outlineThin');
const outlineColorInput = document.getElementById('outlineColor');
const outlineMergeInput = document.getElementById('outlineMerge');
const outlineMergeStrengthRange = document.getElementById('outlineMergeStrengthRange');
const outlineBlendModeInput = document.getElementById('outlineBlendMode');
const edgeStrengthRange = document.getElementById('edgeStrengthRange');
const edgeSmoothRange = document.getElementById('edgeSmoothRange');
const edgeSoftenRange = document.getElementById('edgeSoftenRange');

const resetPreviewButton = document.getElementById('resetPreview');
const applyFullButton = document.getElementById('applyFull');
const fullABToggle = document.getElementById('fullABToggle');

let imageLoaded = false;
let previewRegion = null;
let previewZoom = 1;
let fullZoom = 1;
let previewStale = false;
let isRendering = false;
let renderQueued = false;
let baseReady = false;
let previewABState = 'B';
let fullABState = 'B';
let tunedReady = false;
let isSplitDragging = false;
let isFullSplitDragging = false;

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
    tunedReady = false;
    fullABState = 'B';
    updateFullABToggle();
    updateFullCompareControls();
    fullZoom = 1;
    updateFullCanvasScale();
    previewRegion = null;
    setPreviewActive(false);
    setPreviewStale(false);
    previewSizeTag.textContent = 'No selection';
    updateActivePreviewBox();
    syncPreviewSizeToImage();
  });
};

bindRangeValue(radiusRange, radiusValue, handleSmoothingChange);
bindRangeValue(sigmaColorRange, sigmaColorValue, handleSmoothingChange);
bindRangeValue(lumaPreserveRange, lumaPreserveValue, handleSmoothingChange);
bindRangeValue(chromaSmoothRange, chromaSmoothValue, handleSmoothingChange);
bindRangeValue(chromaSmoothARange, chromaSmoothAValue, handleSmoothingChange);
bindRangeValue(chromaSmoothBRange, chromaSmoothBValue, handleSmoothingChange);
bindRangeValue(chromaRadiusRange, chromaRadiusValue, handleSmoothingChange);
bindRangeValue(chromaSigmaSpaceRange, chromaSigmaSpaceValue, handleSmoothingChange);
bindRangeValue(chromaSigmaColorRange, chromaSigmaColorValue, handleSmoothingChange);
bindRangeValue(chromaClampRange, chromaClampValue, handleSmoothingChange);
bindRangeValue(neutralProtectRange, neutralProtectValue, handleSmoothingChange);
bindRangeValue(lumaProtectRange, lumaProtectValue, handleSmoothingChange);
bindRangeValue(adaptiveChromaRange, adaptiveChromaValue, handleSmoothingChange);
bindRangeValue(artifactBoostRange, artifactBoostValue, handleSmoothingChange);
bindRangeValue(previewSplitRange, previewSplitValue, handleSmoothingChange);
bindRangeValue(fullSplitRange, fullSplitValue, handleFullCompareChange);
bindRangeValue(paletteLevelsRange, paletteLevelsValue, handleSmoothingChange);
bindRangeValue(neighborMergeRange, neighborMergeValue, handleSmoothingChange);
bindRangeValue(edgeStrengthRange, edgeStrengthValue, handleSmoothingChange);
bindRangeValue(edgeSmoothRange, edgeSmoothValue, handleSmoothingChange);
bindRangeValue(edgeSoftenRange, edgeSoftenValue, handleSmoothingChange);
bindRangeValue(edgeSensitivityRange, edgeSensitivityValue, handleSmoothingChange);
bindRangeValue(edgeThresholdRange, edgeThresholdValue, handleSmoothingChange);
bindRangeValue(edgePreblurRange, edgePreblurValue, handleSmoothingChange);
bindRangeValue(edgeInfluenceRange, edgeInfluenceValue, handleSmoothingChange);
bindRangeValue(edgeOverlayOpacityRange, edgeOverlayOpacityValue, handleSmoothingChange);
bindRangeValue(outlineThresholdRange, outlineThresholdValue, handleSmoothingChange);
bindRangeValue(outlineThicknessRange, outlineThicknessValue, handleSmoothingChange);
bindRangeValue(outlineMergeStrengthRange, outlineMergeStrengthValue, handleSmoothingChange);

previewSettingsToggle.addEventListener('click', e => {
  e.stopPropagation();
  const isOpen = previewSettings.classList.toggle('is-open');
  previewSettingsToggle.setAttribute('aria-expanded', String(isOpen));
});

fullImage.addEventListener('wheel', e => {
  if (!imageLoaded) return;
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    adjustFullZoom(e.deltaY);
  }
}, { passive: false });

previewCanvasWrap.addEventListener('wheel', e => {
  if (!previewRegion) return;
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    adjustPreviewZoom(e.deltaY);
  }
}, { passive: false });

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
outlineOverlayInput.addEventListener('change', handleSmoothingChange);
edgeKernelInput.addEventListener('change', handleSmoothingChange);
edgeFalloffInput.addEventListener('change', handleSmoothingChange);
edgeOverlayModeInput.addEventListener('change', handleSmoothingChange);
edgeViewInput.addEventListener('change', handleSmoothingChange);
outlineModeInput.addEventListener('change', handleSmoothingChange);
outlineThinInput.addEventListener('change', handleSmoothingChange);
outlineColorInput.addEventListener('change', handleSmoothingChange);
outlineMergeInput.addEventListener('change', handleSmoothingChange);
outlineBlendModeInput.addEventListener('change', handleSmoothingChange);
smoothingModeInput.addEventListener('change', () => {
  toggleSmoothingModeControls();
  handleSmoothingChange();
});
chromaPresetInput.addEventListener('change', e => {
  applyChromaPreset(e.target.value);
  handleSmoothingChange();
});
protectSkinInput.addEventListener('change', handleSmoothingChange);
previewModeInput.addEventListener('change', handleSmoothingChange);
previewModeInput.addEventListener('change', updatePreviewModeControls);
labAdvancedToggle.addEventListener('change', updateLabAdvancedControls);
fullCompareMode.addEventListener('change', updateFullCompareControls);
fullCompareMode.addEventListener('change', renderFullCompareView);
fullSplitRange.addEventListener('input', handleFullCompareChange);
previewCanvasWrap.addEventListener('mousedown', e => {
  if (previewModeInput.value !== 'split') return;
  if (!previewRegion) return;
  isSplitDragging = true;
  updateSplitFromEvent(e);
});

window.addEventListener('mousemove', e => {
  if (isSplitDragging) {
    updateSplitFromEvent(e);
  }
  if (isFullSplitDragging) {
    updateFullSplitFromEvent(e);
  }
});

window.addEventListener('mouseup', () => {
  if (isSplitDragging) {
    isSplitDragging = false;
  }
  if (isFullSplitDragging) {
    isFullSplitDragging = false;
  }
});

fullCanvas.addEventListener('mousedown', e => {
  if (!tunedReady) return;
  if (fullCompareMode.value !== 'split') return;
  isFullSplitDragging = true;
  updateFullSplitFromEvent(e);
});

fullCanvas.addEventListener('mouseleave', () => {
  if (!isFullSplitDragging) return;
  isFullSplitDragging = false;
});
previewABToggle.addEventListener('click', () => {
  previewABState = previewABState === 'A' ? 'B' : 'A';
  updatePreviewABToggle();
  handleSmoothingChange();
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

controlToggles.forEach(input => {
  if (input === selectionMode || input === previewAutoSizeInput || input === aspectLockInput) return;
  if (input === smoothingModeInput || input === chromaPresetInput || input === previewModeInput) return;
  if (input === protectSkinInput || input === edgeDetectInput || input === edgeOverlayInput) return;
  if (input === outlineOverlayInput || input === outlineThinInput || input === outlineMergeInput) return;
  if (input === edgeKernelInput || input === edgeFalloffInput || input === edgeOverlayModeInput || input === edgeViewInput) return;
  if (input === outlineModeInput || input === outlineColorInput || input === outlineBlendModeInput) return;
  if (input === labAdvancedToggle) return;
  if (input.id === 'previewPixelGrid') return;
  input.addEventListener('change', handleSmoothingChange);
});

applyFullButton.addEventListener('click', () => {
  if (!imageLoaded) return;
  setBusy(true);
  setTimeout(() => {
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
    tunedReady = true;
    fullABState = 'B';
    updateFullABToggle();
    updateFullCompareControls();
    renderFullCompareView();
    setPreviewStale(true);
    setBusy(false);
  }, 0);
});

fullABToggle.addEventListener('click', () => {
  if (!tunedReady) return;
  fullABState = fullABState === 'A' ? 'B' : 'A';
  updateFullABToggle();
  renderFullCompareView();
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
toggleSmoothingModeControls();
updatePreviewABToggle();
updatePreviewModeControls();
updateLabAdvancedControls();
updateFullABToggle();
updateFullCompareControls();
setPreviewActive(false);
setPreviewStale(false);

window.addEventListener('resize', () => {
  if (previewAutoSizeInput.checked) {
    syncPreviewSizeToImage();
    updatePreviewRegionForFixedSize();
  }
  if (imageLoaded) {
    updateFullCanvasScale();
  }
  updateActivePreviewBox();
  if (previewRegion) schedulePreviewRender();
});

function bindRangeValue(rangeInput, valueEl, onChange) {
  if (!rangeInput) return;
  const update = () => {
    if (valueEl) {
      valueEl.textContent = rangeInput.value;
    }
    if (onChange) {
      onChange();
    }
  };
  rangeInput.addEventListener('input', update);
  if (valueEl) {
    valueEl.textContent = rangeInput.value;
  }
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

function handleFullCompareChange() {
  if (!tunedReady) return;
  renderFullCompareView();
}

function getSmoothingOptions() {
  return {
    smoothingMode: smoothingModeInput.value,
    radius: clamp(parseInt(radiusRange.value, 10) || 3, 1, 12),
    sigmaColor: clamp(parseInt(sigmaColorRange.value, 10) || 30, 1, 200),
    sigmaSpace: 4,
    quant: 0,
    lumaPreserve: clamp(parseInt(lumaPreserveRange.value, 10) || 85, 0, 100) / 100,
    chromaSmooth: clamp(parseInt(chromaSmoothRange.value, 10) || 0, 0, 100) / 100,
    chromaSmoothA: clamp(parseInt(chromaSmoothARange.value, 10) || 100, 0, 100) / 100,
    chromaSmoothB: clamp(parseInt(chromaSmoothBRange.value, 10) || 100, 0, 100) / 100,
    chromaRadius: clamp(parseInt(chromaRadiusRange.value, 10) || 2, 1, 8),
    chromaSigmaSpace: clamp(parseFloat(chromaSigmaSpaceRange.value) || 3, 0.5, 12),
    chromaSigmaColor: clamp(parseInt(chromaSigmaColorRange.value, 10) || 26, 1, 80),
    chromaClamp: clamp(parseInt(chromaClampRange.value, 10) || 0, 0, 100) / 100,
    neutralProtect: clamp(parseInt(neutralProtectRange.value, 10) || 0, 0, 100) / 100,
    lumaProtect: clamp(parseInt(lumaProtectRange.value, 10) || 0, 0, 100) / 100,
    adaptiveChroma: clamp(parseInt(adaptiveChromaRange.value, 10) || 0, 0, 100) / 100,
    protectSkin: !!protectSkinInput.checked,
    artifactBoost: clamp(parseInt(artifactBoostRange.value, 10) || 0, 0, 100) / 100,
    previewMode: previewModeInput.value,
    previewSplit: clamp(parseInt(previewSplitRange.value, 10) || 50, 0, 100) / 100,
    paletteLevels: clamp(parseInt(paletteLevelsRange.value, 10) || 0, 0, 32),
    neighborMerge: clamp(parseInt(neighborMergeRange.value, 10) || 0, 0, 100) / 100,
    edgeDetect: !!edgeDetectInput.checked,
    edgeOverlay: !!edgeOverlayInput.checked,
    outlineOverlay: !!outlineOverlayInput.checked,
    edgeKernel: edgeKernelInput.value || 'sobel',
    edgeSensitivity: clamp(parseInt(edgeSensitivityRange.value, 10) || 50, 0, 100) / 100,
    edgeThreshold: clamp(parseInt(edgeThresholdRange.value, 10) || 30, 0, 100) / 100,
    edgePreblur: clamp(parseInt(edgePreblurRange.value, 10) || 1, 0, 3),
    edgeInfluence: clamp(parseInt(edgeInfluenceRange.value, 10) || 1, 0, 6),
    edgeFalloff: edgeFalloffInput.value || 'linear',
    edgeOverlayMode: edgeOverlayModeInput.value || 'both',
    edgeOverlayOpacity: clamp(parseInt(edgeOverlayOpacityRange.value, 10) || 70, 0, 100) / 100,
    edgeView: edgeViewInput.value || 'result',
    outlineMode: outlineModeInput.value || 'weighted',
    outlineThreshold: clamp(parseInt(outlineThresholdRange.value, 10) || 30, 0, 100) / 100,
    outlineThickness: clamp(parseInt(outlineThicknessRange.value, 10) || 1, 1, 6),
    outlineThin: !!outlineThinInput.checked,
    outlineColor: outlineColorInput.value || 'black',
    outlineMerge: !!outlineMergeInput.checked,
    outlineMergeStrength: clamp(parseInt(outlineMergeStrengthRange.value, 10) || 40, 0, 100) / 100,
    outlineBlendMode: outlineBlendModeInput.value || 'multiply',
    edgePreserve: clamp(parseInt(edgeStrengthRange.value, 10) || 0, 0, 100) / 100,
    edgeSmooth: clamp(parseInt(edgeSmoothRange.value, 10) || 0, 0, 3),
    edgeSoften: clamp(parseInt(edgeSoftenRange.value, 10) || 0, 0, 100) / 100
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
  previewZoom = clamp(zoom, 0.5, 8);
  zoomButtons.forEach(button => {
    const target = Number(button.dataset.zoom);
    button.classList.toggle('is-active', Math.abs(target - previewZoom) < 0.05);
  });

  if (previewZoom < 2) {
    pixelGridInput.checked = false;
    pixelGridInput.disabled = true;
  } else {
    pixelGridInput.disabled = false;
  }

  if (previewRegion) schedulePreviewRender();
}

function adjustPreviewZoom(deltaY) {
  const step = 0.1;
  const direction = deltaY > 0 ? -1 : 1;
  const next = previewZoom + direction * step;
  setPreviewZoom(next);
}

function adjustFullZoom(deltaY) {
  const step = 0.1;
  const direction = deltaY > 0 ? -1 : 1;
  fullZoom = clamp(fullZoom + direction * step, 0.5, 6);
  updateFullCanvasScale();
  updateActivePreviewBox();
}

function updateFullCanvasScale() {
  if (!imageLoaded) return;
  const baseScale = getFullBaseScale();
  const scale = baseScale * fullZoom;
  fullCanvas.style.width = `${Math.max(1, Math.round(fullCanvas.width * scale))}px`;
  fullCanvas.style.height = `${Math.max(1, Math.round(fullCanvas.height * scale))}px`;
}

function getFullBaseScale() {
  const w = Math.max(1, fullImage.clientWidth || 1);
  const h = Math.max(1, fullImage.clientHeight || 1);
  return Math.min(w / fullCanvas.width, h / fullCanvas.height);
}

function toggleFixedInputs() {
  const isFixed = selectionMode.value === 'fixed';
  const customSize = !previewAutoSizeInput.checked;
  previewWidthInput.disabled = !isFixed || !customSize;
  previewHeightInput.disabled = !isFixed || !customSize;
  aspectLockInput.disabled = selectionMode.value !== 'drag';
}

function toggleSmoothingModeControls() {
  const isLab = smoothingModeInput.value !== 'rgb';
  document.querySelectorAll('[data-mode="rgb"]').forEach(el => {
    el.classList.toggle('is-hidden', isLab);
  });
  document.querySelectorAll('[data-mode="rgb"] input, [data-mode="rgb"] select').forEach(el => {
    el.disabled = isLab;
  });
  document.querySelectorAll('[data-mode="lab"]').forEach(el => {
    el.classList.toggle('is-hidden', !isLab);
  });
  document.querySelectorAll('[data-mode="lab"] input, [data-mode="lab"] select').forEach(el => {
    el.disabled = !isLab;
  });
  chromaPresetInput.disabled = !isLab;
  protectSkinInput.disabled = !isLab;
  if (!isLab) {
    labAdvancedControls.classList.add('is-hidden');
  } else {
    updateLabAdvancedControls();
  }
}

function updatePreviewModeControls() {
  const isSplit = previewModeInput.value === 'split';
  const isAB = previewModeInput.value === 'ab';
  previewSplitControls.classList.toggle('is-hidden', !isSplit);
  previewABControls.classList.toggle('is-hidden', !isAB);
  previewSplitRange.disabled = !isSplit;
  previewABToggle.disabled = !isAB;
  previewCanvasWrap.style.cursor = isSplit ? 'ew-resize' : 'default';
  updatePreviewABToggle();
}

function updateLabAdvancedControls() {
  const show = !!labAdvancedToggle.checked;
  labAdvancedControls.classList.toggle('is-hidden', !show);
}

function updateFullCompareControls() {
  const ready = tunedReady;
  fullCompareMode.disabled = !ready;
  const mode = fullCompareMode.value;
  const isSplit = mode === 'split';
  const isAB = mode === 'ab';
  fullSplitControls.classList.toggle('is-hidden', !isSplit);
  fullABControls.classList.toggle('is-hidden', !isAB);
  fullSplitRange.disabled = !ready || !isSplit;
  fullABToggle.disabled = !ready || !isAB;
  fullCanvas.style.cursor = ready && isSplit ? 'ew-resize' : 'crosshair';
  updateFullABToggle();
}

function updateSplitFromEvent(e) {
  const rect = previewCanvas.getBoundingClientRect();
  const x = clamp(e.clientX - rect.left, 0, rect.width || 1);
  const ratio = rect.width ? x / rect.width : 0.5;
  const value = Math.round(ratio * 100);
  previewSplitRange.value = value;
  if (previewSplitValue) previewSplitValue.textContent = value;
  handleSmoothingChange();
}

function updateFullSplitFromEvent(e) {
  const rect = fullCanvas.getBoundingClientRect();
  const x = clamp(e.clientX - rect.left, 0, rect.width || 1);
  const ratio = rect.width ? x / rect.width : 0.5;
  const value = Math.round(ratio * 100);
  fullSplitRange.value = value;
  if (fullSplitValue) fullSplitValue.textContent = value;
  renderFullCompareView();
}

function updateFullABToggle() {
  if (!fullABToggle) return;
  if (!tunedReady) {
    fullABToggle.textContent = 'Show Original';
    return;
  }
  fullABToggle.textContent = fullABState === 'A' ? 'Show Result' : 'Show Original';
}

function renderFullCompareView() {
  if (!imageLoaded) return;
  if (!tunedReady) return;
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
    fullCtx.save();
    fullCtx.strokeStyle = 'rgba(255,255,255,0.7)';
    fullCtx.lineWidth = 1;
    fullCtx.beginPath();
    fullCtx.moveTo(splitX + 0.5, 0);
    fullCtx.lineTo(splitX + 0.5, fullCanvas.height);
    fullCtx.stroke();
    fullCtx.fillStyle = 'rgba(0,0,0,0.55)';
    fullCtx.fillRect(splitX - 6, Math.max(0, fullCanvas.height / 2 - 14), 12, 28);
    fullCtx.strokeStyle = 'rgba(255,255,255,0.85)';
    fullCtx.strokeRect(splitX - 6, Math.max(0, fullCanvas.height / 2 - 14), 12, 28);
    fullCtx.restore();
  } else if (fullABState === 'A') {
    fullCtx.drawImage(baseCanvas, 0, 0);
  } else {
    fullCtx.drawImage(tunedCanvas, 0, 0);
  }
}

function updatePreviewABToggle() {
  if (!previewABToggle) return;
  previewABToggle.textContent = previewABState === 'A' ? 'Show B' : 'Show A';
}

function setRangeValue(rangeInput, valueEl, value) {
  rangeInput.value = value;
  if (valueEl) {
    valueEl.textContent = value;
  }
}

function applyChromaPreset(preset) {
  smoothingModeInput.value = 'lab';
  toggleSmoothingModeControls();
  const presets = {
    subtle: {
      lumaPreserve: 92,
      chromaSmooth: 35,
      chromaSmoothA: 100,
      chromaSmoothB: 100,
      chromaRadius: 2,
      chromaSigmaSpace: 2.5,
      chromaSigmaColor: 18,
      chromaClamp: 60,
      neutralProtect: 60,
      lumaProtect: 55,
      adaptiveChroma: 55,
      protectSkin: true
    },
    balanced: {
      lumaPreserve: 85,
      chromaSmooth: 60,
      chromaSmoothA: 100,
      chromaSmoothB: 100,
      chromaRadius: 3,
      chromaSigmaSpace: 3,
      chromaSigmaColor: 26,
      chromaClamp: 45,
      neutralProtect: 45,
      lumaProtect: 35,
      adaptiveChroma: 40,
      protectSkin: true
    },
    aggressive: {
      lumaPreserve: 75,
      chromaSmooth: 85,
      chromaSmoothA: 100,
      chromaSmoothB: 100,
      chromaRadius: 4,
      chromaSigmaSpace: 4,
      chromaSigmaColor: 36,
      chromaClamp: 30,
      neutralProtect: 30,
      lumaProtect: 20,
      adaptiveChroma: 25,
      protectSkin: true
    }
  };

  if (!presets[preset]) return;
  const values = presets[preset];
  setRangeValue(lumaPreserveRange, lumaPreserveValue, values.lumaPreserve);
  setRangeValue(chromaSmoothRange, chromaSmoothValue, values.chromaSmooth);
  setRangeValue(chromaSmoothARange, chromaSmoothAValue, values.chromaSmoothA);
  setRangeValue(chromaSmoothBRange, chromaSmoothBValue, values.chromaSmoothB);
  setRangeValue(chromaRadiusRange, chromaRadiusValue, values.chromaRadius);
  setRangeValue(chromaSigmaSpaceRange, chromaSigmaSpaceValue, values.chromaSigmaSpace);
  setRangeValue(chromaSigmaColorRange, chromaSigmaColorValue, values.chromaSigmaColor);
  setRangeValue(chromaClampRange, chromaClampValue, values.chromaClamp);
  setRangeValue(neutralProtectRange, neutralProtectValue, values.neutralProtect);
  setRangeValue(lumaProtectRange, lumaProtectValue, values.lumaProtect);
  setRangeValue(adaptiveChromaRange, adaptiveChromaValue, values.adaptiveChroma);
  protectSkinInput.checked = values.protectSkin;
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
  const scale = baseScale * previewZoom;
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
    previewCtx.save();
    previewCtx.strokeStyle = 'rgba(255,255,255,0.7)';
    previewCtx.lineWidth = 1;
    previewCtx.beginPath();
    previewCtx.moveTo(splitX + 0.5, 0);
    previewCtx.lineTo(splitX + 0.5, scaledH);
    previewCtx.stroke();
    previewCtx.fillStyle = 'rgba(0,0,0,0.55)';
    previewCtx.fillRect(splitX - 6, Math.max(0, scaledH / 2 - 14), 12, 28);
    previewCtx.strokeStyle = 'rgba(255,255,255,0.85)';
    previewCtx.strokeRect(splitX - 6, Math.max(0, scaledH / 2 - 14), 12, 28);
    previewCtx.restore();
  } else if (previewMode === 'ab') {
    if (previewABState === 'A') {
      previewCtx.drawImage(basePreviewCanvas, 0, 0, scaledW, scaledH);
    } else {
      previewCtx.drawImage(bufferCanvas, 0, 0, scaledW, scaledH);
    }
  } else {
    previewCtx.drawImage(bufferCanvas, 0, 0, scaledW, scaledH);
  }

  if (edgeMap && (options.edgeOverlay || options.outlineOverlay) && options.edgeView === 'result') {
    const overlayMode = options.edgeOverlayMode || 'both';
    const opacity = Math.max(0, Math.min(1, options.edgeOverlayOpacity ?? 0.75));
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

  const gridScale = scale;
  if (pixelGridInput.checked && gridScale >= 2) {
    drawPixelGrid(previewCtx, scaledW, scaledH, gridScale, 0, 0, scaledW, scaledH);
  }

  previewSizeTag.textContent = `${formatRegion(previewRegion)} | ${formatZoom(previewZoom)}x`;
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

function applyEdgePreserve(original, smoothed, edgeMap, strength, falloff = 'linear') {
  if (!edgeMap || strength <= 0) return smoothed;
  const out = new ImageData(new Uint8ClampedArray(smoothed.data.length), smoothed.width, smoothed.height);
  const src = smoothed.data;
  const base = original.data;
  const dst = out.data;
  const k = Math.max(0, Math.min(1, strength));
  const useSmooth = falloff === 'smoothstep';

  for (let i = 0; i < edgeMap.length; i++) {
    let edge = edgeMap[i] * k;
    if (useSmooth) {
      edge = edge * edge * (3 - 2 * edge);
    }
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

function applyOutlineMerge(imgData, outlineMap, options) {
  const strength = clamp(options.outlineMergeStrength ?? 0, 0, 1);
  if (!outlineMap || strength <= 0) return imgData;

  const { width, height, data } = imgData;
  const out = new Uint8ClampedArray(data.length);
  const color = getOutlineColor(options.outlineColor);
  const mode = options.outlineBlendMode || 'multiply';

  for (let i = 0; i < outlineMap.length; i++) {
    const t = Math.max(0, Math.min(1, outlineMap[i] * strength));
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    if (t <= 0) {
      out[idx] = r;
      out[idx + 1] = g;
      out[idx + 2] = b;
      out[idx + 3] = data[idx + 3];
      continue;
    }

    const blended = blendOutlinePixel(r, g, b, color, mode);
    out[idx] = Math.round(r + (blended[0] - r) * t);
    out[idx + 1] = Math.round(g + (blended[1] - g) * t);
    out[idx + 2] = Math.round(b + (blended[2] - b) * t);
    out[idx + 3] = data[idx + 3];
  }

  return new ImageData(out, width, height);
}

function blendOutlinePixel(r, g, b, color, mode) {
  const cr = color[0];
  const cg = color[1];
  const cb = color[2];
  if (mode === 'darken') {
    return [Math.min(r, cr), Math.min(g, cg), Math.min(b, cb)];
  }
  if (mode === 'overlay') {
    return [
      blendOverlayChannel(r, cr),
      blendOverlayChannel(g, cg),
      blendOverlayChannel(b, cb)
    ];
  }
  if (mode === 'edge-darken') {
    return [
      Math.max(0, r - 90),
      Math.max(0, g - 90),
      Math.max(0, b - 90)
    ];
  }
  return [
    Math.round((r * cr) / 255),
    Math.round((g * cg) / 255),
    Math.round((b * cb) / 255)
  ];
}

function blendOverlayChannel(base, blend) {
  if (base < 128) {
    return Math.round((2 * base * blend) / 255);
  }
  return Math.round(255 - (2 * (255 - base) * (255 - blend)) / 255);
}

function getOutlineColor(choice) {
  if (choice === 'accent') return [0, 209, 255];
  if (choice === 'dark') return [20, 20, 20];
  return [0, 0, 0];
}

function formatRegion(region) {
  return `Region ${region.w}x${region.h} at ${region.x},${region.y}`;
}

function formatZoom(zoom) {
  if (Math.abs(zoom - Math.round(zoom)) < 0.01) {
    return Math.round(zoom).toString();
  }
  return zoom.toFixed(2);
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
