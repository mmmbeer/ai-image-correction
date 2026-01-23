import { loadImage } from './imageLoader.js';
import { initPreviewSelector } from './previewSelector.js';
import { getDom } from './app/dom.js';
import { createState } from './app/state.js';
import { getBaseImageData } from './app/processing/baseImage.js';
import { getSmoothingOptions } from './app/processing/options.js';
import { createPreviewRenderer } from './app/preview/previewRender.js';
import {
  getFixedSize,
  getAspectRatio,
  setPreviewZoom,
  adjustPreviewZoom,
  adjustFullZoom,
  updateFullCanvasScale,
  updatePreviewRegionForFixedSize,
  syncPreviewSizeToImage,
  updateActivePreviewBox
} from './app/preview/previewSizing.js';
import {
  bindRangeValue,
  applyChromaPreset,
  toggleFixedInputs,
  toggleSmoothingModeControls,
  updatePreviewModeControls,
  updateLabAdvancedControls,
  updateFullCompareControls,
  updateSplitFromEvent,
  updateFullSplitFromEvent,
  updatePreviewABToggle,
  updateFullABToggle
} from './app/ui/controls.js';
import { setPreviewActive, setPreviewStale, setBusy } from './app/ui/status.js';
import { createFullRenderer } from './app/full/fullRender.js';

const dom = getDom();
const state = createState();

const getBaseImageDataFor = (x, y, w, h) => getBaseImageData(dom, state, x, y, w, h);
const getSmoothingOptionsFor = () => getSmoothingOptions(dom);

const { schedulePreviewRender } = createPreviewRenderer({
  dom,
  state,
  getBaseImageData: getBaseImageDataFor,
  getSmoothingOptions: getSmoothingOptionsFor,
  setPreviewActive,
  setPreviewStale,
  setBusy
});

const { applyFullImage, renderFullCompareView } = createFullRenderer({
  dom,
  state,
  getBaseImageData: getBaseImageDataFor,
  getSmoothingOptions: getSmoothingOptionsFor,
  setPreviewStale,
  setBusy,
  updateFullABToggle,
  updateFullCompareControls
});

function handleSettingsChange() {
  if (dom.inputs.previewAutoSizeInput.checked) {
    syncPreviewSizeToImage(dom, state);
  }

  if (!state.previewRegion) return;

  if (dom.inputs.selectionMode.value === 'fixed') {
    updatePreviewRegionForFixedSize(dom, state);
    schedulePreviewRender();
    return;
  }

  setPreviewStale(dom, state, true);
}

function handleSmoothingChange() {
  if (!state.previewRegion) return;
  schedulePreviewRender();
}

function handleFullCompareChange() {
  if (!state.tunedReady) return;
  renderFullCompareView();
}

function initUploadHandler() {
  dom.inputs.uploadInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    loadImage(file, dom.canvases.fullCanvas, dom.contexts.fullCtx).then(() => {
      state.imageLoaded = true;
      state.baseReady = true;
      dom.canvases.baseCanvas.width = dom.canvases.fullCanvas.width;
      dom.canvases.baseCanvas.height = dom.canvases.fullCanvas.height;
      dom.contexts.baseCtx.clearRect(0, 0, dom.canvases.baseCanvas.width, dom.canvases.baseCanvas.height);
      dom.contexts.baseCtx.drawImage(dom.canvases.fullCanvas, 0, 0);
      state.tunedReady = false;
      state.fullABState = 'B';
      updateFullABToggle(dom, state);
      updateFullCompareControls(dom, state);
      state.fullZoom = 1;
      updateFullCanvasScale(dom, state);
      state.previewRegion = null;
      setPreviewActive(dom, false);
      setPreviewStale(dom, state, false);
      dom.elements.previewSizeTag.textContent = 'No selection';
      updateActivePreviewBox(dom, state);
      syncPreviewSizeToImage(dom, state);
    });
  };
}

function initRangeBindings() {
  const inputs = dom.inputs;
  const values = dom.values;
  bindRangeValue(inputs.radiusRange, values.radiusValue, handleSmoothingChange);
  bindRangeValue(inputs.sigmaColorRange, values.sigmaColorValue, handleSmoothingChange);
  bindRangeValue(inputs.lumaPreserveRange, values.lumaPreserveValue, handleSmoothingChange);
  bindRangeValue(inputs.chromaSmoothRange, values.chromaSmoothValue, handleSmoothingChange);
  bindRangeValue(inputs.chromaSmoothARange, values.chromaSmoothAValue, handleSmoothingChange);
  bindRangeValue(inputs.chromaSmoothBRange, values.chromaSmoothBValue, handleSmoothingChange);
  bindRangeValue(inputs.chromaRadiusRange, values.chromaRadiusValue, handleSmoothingChange);
  bindRangeValue(inputs.chromaSigmaSpaceRange, values.chromaSigmaSpaceValue, handleSmoothingChange);
  bindRangeValue(inputs.chromaSigmaColorRange, values.chromaSigmaColorValue, handleSmoothingChange);
  bindRangeValue(inputs.chromaClampRange, values.chromaClampValue, handleSmoothingChange);
  bindRangeValue(inputs.neutralProtectRange, values.neutralProtectValue, handleSmoothingChange);
  bindRangeValue(inputs.lumaProtectRange, values.lumaProtectValue, handleSmoothingChange);
  bindRangeValue(inputs.adaptiveChromaRange, values.adaptiveChromaValue, handleSmoothingChange);
  bindRangeValue(inputs.artifactBoostRange, values.artifactBoostValue, handleSmoothingChange);
  bindRangeValue(inputs.previewSplitRange, values.previewSplitValue, handleSmoothingChange);
  bindRangeValue(inputs.fullSplitRange, values.fullSplitValue, handleFullCompareChange);
  bindRangeValue(inputs.paletteLevelsRange, values.paletteLevelsValue, handleSmoothingChange);
  bindRangeValue(inputs.neighborMergeRange, values.neighborMergeValue, handleSmoothingChange);
  bindRangeValue(inputs.edgeStrengthRange, values.edgeStrengthValue, handleSmoothingChange);
  bindRangeValue(inputs.edgeSmoothRange, values.edgeSmoothValue, handleSmoothingChange);
  bindRangeValue(inputs.edgeSoftenRange, values.edgeSoftenValue, handleSmoothingChange);
  bindRangeValue(inputs.edgeSensitivityRange, values.edgeSensitivityValue, handleSmoothingChange);
  bindRangeValue(inputs.edgeThresholdRange, values.edgeThresholdValue, handleSmoothingChange);
  bindRangeValue(inputs.edgePreblurRange, values.edgePreblurValue, handleSmoothingChange);
  bindRangeValue(inputs.edgeInfluenceRange, values.edgeInfluenceValue, handleSmoothingChange);
  bindRangeValue(inputs.edgeOverlayOpacityRange, values.edgeOverlayOpacityValue, handleSmoothingChange);
  bindRangeValue(inputs.outlineThresholdRange, values.outlineThresholdValue, handleSmoothingChange);
  bindRangeValue(inputs.outlineThicknessRange, values.outlineThicknessValue, handleSmoothingChange);
  bindRangeValue(inputs.outlineMergeStrengthRange, values.outlineMergeStrengthValue, handleSmoothingChange);
}

function initUIEvents() {
  dom.elements.previewSettingsToggle.addEventListener('click', event => {
    event.stopPropagation();
    const isOpen = dom.elements.previewSettings.classList.toggle('is-open');
    dom.elements.previewSettingsToggle.setAttribute('aria-expanded', String(isOpen));
  });

  dom.canvases.fullImage.addEventListener('wheel', event => {
    if (!state.imageLoaded) return;
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      adjustFullZoom(dom, state, event.deltaY, updateFullCanvasScale, updateActivePreviewBox);
    }
  }, { passive: false });

  dom.canvases.previewCanvasWrap.addEventListener('wheel', event => {
    if (!state.previewRegion) return;
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      adjustPreviewZoom(dom, state, event.deltaY, schedulePreviewRender);
    }
  }, { passive: false });

  document.addEventListener('click', event => {
    if (!dom.elements.previewSettings.classList.contains('is-open')) return;
    if (dom.elements.previewSettings.contains(event.target) || dom.elements.previewSettingsToggle.contains(event.target)) return;
    dom.elements.previewSettings.classList.remove('is-open');
    dom.elements.previewSettingsToggle.setAttribute('aria-expanded', 'false');
  });

  dom.inputs.selectionMode.addEventListener('change', () => {
    toggleFixedInputs(dom);
    handleSettingsChange();
  });

  dom.inputs.previewWidthInput.addEventListener('input', handleSettingsChange);
  dom.inputs.previewHeightInput.addEventListener('input', handleSettingsChange);
  dom.inputs.aspectLockInput.addEventListener('change', handleSettingsChange);
  dom.inputs.previewAutoSizeInput.addEventListener('change', () => {
    toggleFixedInputs(dom);
    handleSettingsChange();
  });

  dom.inputs.pixelGridInput.addEventListener('change', () => {
    if (state.previewRegion) schedulePreviewRender();
  });

  dom.inputs.edgeDetectInput.addEventListener('change', handleSmoothingChange);
  dom.inputs.edgeOverlayInput.addEventListener('change', handleSmoothingChange);
  dom.inputs.outlineOverlayInput.addEventListener('change', handleSmoothingChange);
  dom.inputs.edgeKernelInput.addEventListener('change', handleSmoothingChange);
  dom.inputs.edgeFalloffInput.addEventListener('change', handleSmoothingChange);
  dom.inputs.edgeOverlayModeInput.addEventListener('change', handleSmoothingChange);
  dom.inputs.edgeViewInput.addEventListener('change', handleSmoothingChange);
  dom.inputs.outlineModeInput.addEventListener('change', handleSmoothingChange);
  dom.inputs.outlineThinInput.addEventListener('change', handleSmoothingChange);
  dom.inputs.outlineColorInput.addEventListener('change', handleSmoothingChange);
  dom.inputs.outlineMergeInput.addEventListener('change', handleSmoothingChange);
  dom.inputs.outlineBlendModeInput.addEventListener('change', handleSmoothingChange);
  dom.inputs.smoothingModeInput.addEventListener('change', () => {
    toggleSmoothingModeControls(dom);
    handleSmoothingChange();
  });
  dom.inputs.chromaPresetInput.addEventListener('change', event => {
    applyChromaPreset(event.target.value, dom);
    handleSmoothingChange();
  });
  dom.inputs.protectSkinInput.addEventListener('change', handleSmoothingChange);
  dom.inputs.previewModeInput.addEventListener('change', handleSmoothingChange);
  dom.inputs.previewModeInput.addEventListener('change', () => updatePreviewModeControls(dom, state));
  dom.inputs.labAdvancedToggle.addEventListener('change', () => updateLabAdvancedControls(dom));
  dom.inputs.fullCompareMode.addEventListener('change', () => updateFullCompareControls(dom, state));
  dom.inputs.fullCompareMode.addEventListener('change', renderFullCompareView);
  dom.inputs.fullSplitRange.addEventListener('input', handleFullCompareChange);

  dom.canvases.previewCanvasWrap.addEventListener('mousedown', event => {
    if (dom.inputs.previewModeInput.value !== 'split') return;
    if (!state.previewRegion) return;
    state.isSplitDragging = true;
    updateSplitFromEvent(event, dom, handleSmoothingChange);
  });

  window.addEventListener('mousemove', event => {
    if (state.isSplitDragging) {
      updateSplitFromEvent(event, dom, handleSmoothingChange);
    }
    if (state.isFullSplitDragging) {
      updateFullSplitFromEvent(event, dom, renderFullCompareView);
    }
  });

  window.addEventListener('mouseup', () => {
    if (state.isSplitDragging) {
      state.isSplitDragging = false;
    }
    if (state.isFullSplitDragging) {
      state.isFullSplitDragging = false;
    }
  });

  dom.canvases.fullCanvas.addEventListener('mousedown', event => {
    if (!state.tunedReady) return;
    if (dom.inputs.fullCompareMode.value !== 'split') return;
    state.isFullSplitDragging = true;
    updateFullSplitFromEvent(event, dom, renderFullCompareView);
  });

  dom.canvases.fullCanvas.addEventListener('mouseleave', () => {
    if (!state.isFullSplitDragging) return;
    state.isFullSplitDragging = false;
  });

  dom.inputs.previewABToggle.addEventListener('click', () => {
    state.previewABState = state.previewABState === 'A' ? 'B' : 'A';
    updatePreviewABToggle(dom, state);
    handleSmoothingChange();
  });

  dom.inputs.zoomButtons.forEach(button => {
    button.addEventListener('click', () => {
      setPreviewZoom(dom, state, Number(button.dataset.zoom), schedulePreviewRender);
    });
  });

  dom.buttons.resetPreviewButton.addEventListener('click', () => {
    state.previewRegion = null;
    dom.contexts.previewCtx.clearRect(0, 0, dom.canvases.previewCanvas.width, dom.canvases.previewCanvas.height);
    setPreviewActive(dom, false);
    setPreviewStale(dom, state, false);
    dom.elements.previewSizeTag.textContent = 'No selection';
    updateActivePreviewBox(dom, state);
  });

  dom.inputs.controlToggles.forEach(input => {
    if (input === dom.inputs.selectionMode || input === dom.inputs.previewAutoSizeInput || input === dom.inputs.aspectLockInput) return;
    if (input === dom.inputs.smoothingModeInput || input === dom.inputs.chromaPresetInput || input === dom.inputs.previewModeInput) return;
    if (input === dom.inputs.protectSkinInput || input === dom.inputs.edgeDetectInput || input === dom.inputs.edgeOverlayInput) return;
    if (input === dom.inputs.outlineOverlayInput || input === dom.inputs.outlineThinInput || input === dom.inputs.outlineMergeInput) return;
    if (input === dom.inputs.edgeKernelInput || input === dom.inputs.edgeFalloffInput || input === dom.inputs.edgeOverlayModeInput || input === dom.inputs.edgeViewInput) return;
    if (input === dom.inputs.outlineModeInput || input === dom.inputs.outlineColorInput || input === dom.inputs.outlineBlendModeInput) return;
    if (input === dom.inputs.labAdvancedToggle) return;
    if (input.id === 'previewPixelGrid') return;
    input.addEventListener('change', handleSmoothingChange);
  });

  dom.buttons.applyFullButton.addEventListener('click', applyFullImage);

  dom.buttons.fullABToggle.addEventListener('click', () => {
    if (!state.tunedReady) return;
    state.fullABState = state.fullABState === 'A' ? 'B' : 'A';
    updateFullABToggle(dom, state);
    renderFullCompareView();
  });
}

function initPreviewSelectorBinding() {
  initPreviewSelector({
    canvas: dom.canvases.fullCanvas,
    previewBox: dom.canvases.previewBox,
    isEnabled: () => state.imageLoaded,
    getMode: () => dom.inputs.selectionMode.value,
    getFixedSize: () => getFixedSize(dom),
    isAspectLocked: () => dom.inputs.aspectLockInput.checked,
    getAspectRatio: () => getAspectRatio(dom),
    onHover: region => {
      if (!region) return;
      if (!state.previewRegion) {
        dom.elements.previewSizeTag.textContent = `Region ${region.w}x${region.h} at ${region.x},${region.y}`;
      }
    },
    onSelect: region => {
      state.previewRegion = region;
      updateActivePreviewBox(dom, state);
      schedulePreviewRender();
    }
  });
}

function initWindowHandlers() {
  window.addEventListener('resize', () => {
    if (dom.inputs.previewAutoSizeInput.checked) {
      syncPreviewSizeToImage(dom, state);
      updatePreviewRegionForFixedSize(dom, state);
    }
    if (state.imageLoaded) {
      updateFullCanvasScale(dom, state);
    }
    updateActivePreviewBox(dom, state);
    if (state.previewRegion) schedulePreviewRender();
  });
}

function initDefaults() {
  setPreviewZoom(dom, state, 1, schedulePreviewRender);
  toggleFixedInputs(dom);
  toggleSmoothingModeControls(dom);
  updatePreviewABToggle(dom, state);
  updatePreviewModeControls(dom, state);
  updateLabAdvancedControls(dom);
  updateFullABToggle(dom, state);
  updateFullCompareControls(dom, state);
  setPreviewActive(dom, false);
  setPreviewStale(dom, state, false);
}

initUploadHandler();
initRangeBindings();
initUIEvents();
initPreviewSelectorBinding();
initWindowHandlers();
initDefaults();
