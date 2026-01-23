import { clamp } from '../../utils/math.js';

export function bindRangeValue(rangeInput, valueEl, onChange) {
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

export function setRangeValue(rangeInput, valueEl, value) {
  rangeInput.value = value;
  if (valueEl) {
    valueEl.textContent = value;
  }
}

export function applyChromaPreset(preset, dom) {
  const { smoothingModeInput, chromaPresetInput, protectSkinInput } = dom.inputs;
  const values = dom.values;

  smoothingModeInput.value = 'lab';
  toggleSmoothingModeControls(dom);
  chromaPresetInput.value = preset;

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
  const presetValues = presets[preset];
  setRangeValue(dom.inputs.lumaPreserveRange, values.lumaPreserveValue, presetValues.lumaPreserve);
  setRangeValue(dom.inputs.chromaSmoothRange, values.chromaSmoothValue, presetValues.chromaSmooth);
  setRangeValue(dom.inputs.chromaSmoothARange, values.chromaSmoothAValue, presetValues.chromaSmoothA);
  setRangeValue(dom.inputs.chromaSmoothBRange, values.chromaSmoothBValue, presetValues.chromaSmoothB);
  setRangeValue(dom.inputs.chromaRadiusRange, values.chromaRadiusValue, presetValues.chromaRadius);
  setRangeValue(dom.inputs.chromaSigmaSpaceRange, values.chromaSigmaSpaceValue, presetValues.chromaSigmaSpace);
  setRangeValue(dom.inputs.chromaSigmaColorRange, values.chromaSigmaColorValue, presetValues.chromaSigmaColor);
  setRangeValue(dom.inputs.chromaClampRange, values.chromaClampValue, presetValues.chromaClamp);
  setRangeValue(dom.inputs.neutralProtectRange, values.neutralProtectValue, presetValues.neutralProtect);
  setRangeValue(dom.inputs.lumaProtectRange, values.lumaProtectValue, presetValues.lumaProtect);
  setRangeValue(dom.inputs.adaptiveChromaRange, values.adaptiveChromaValue, presetValues.adaptiveChroma);
  protectSkinInput.checked = presetValues.protectSkin;
}

export function toggleFixedInputs(dom) {
  const { selectionMode, previewAutoSizeInput, previewWidthInput, previewHeightInput, aspectLockInput } = dom.inputs;
  const isFixed = selectionMode.value === 'fixed';
  const customSize = !previewAutoSizeInput.checked;
  previewWidthInput.disabled = !isFixed || !customSize;
  previewHeightInput.disabled = !isFixed || !customSize;
  aspectLockInput.disabled = selectionMode.value !== 'drag';
}

export function toggleSmoothingModeControls(dom) {
  const { smoothingModeInput, chromaPresetInput, protectSkinInput, labAdvancedToggle } = dom.inputs;
  const { labAdvancedControls } = dom.elements;
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
    labAdvancedToggle.checked = false;
  } else {
    updateLabAdvancedControls(dom);
  }
}

export function updatePreviewModeControls(dom, state) {
  const { previewModeInput, previewSplitRange, previewABToggle } = dom.inputs;
  const { previewSplitControls, previewABControls } = dom.elements;
  const { previewCanvasWrap } = dom.canvases;
  const isSplit = previewModeInput.value === 'split';
  const isAB = previewModeInput.value === 'ab';
  previewSplitControls.classList.toggle('is-hidden', !isSplit);
  previewABControls.classList.toggle('is-hidden', !isAB);
  previewSplitRange.disabled = !isSplit;
  previewABToggle.disabled = !isAB;
  previewCanvasWrap.style.cursor = isSplit ? 'ew-resize' : 'default';
  updatePreviewABToggle(dom, state);
}

export function updateLabAdvancedControls(dom) {
  const { labAdvancedToggle } = dom.inputs;
  const { labAdvancedControls } = dom.elements;
  const show = !!labAdvancedToggle.checked;
  labAdvancedControls.classList.toggle('is-hidden', !show);
}

export function updateFullCompareControls(dom, state) {
  const { fullCompareMode, fullSplitRange } = dom.inputs;
  const { fullSplitControls, fullABControls } = dom.elements;
  const { fullCanvas } = dom.canvases;
  const { fullABToggle } = dom.buttons;
  const ready = state.tunedReady;
  fullCompareMode.disabled = !ready;
  const mode = fullCompareMode.value;
  const isSplit = mode === 'split';
  const isAB = mode === 'ab';
  fullSplitControls.classList.toggle('is-hidden', !isSplit);
  fullABControls.classList.toggle('is-hidden', !isAB);
  fullSplitRange.disabled = !ready || !isSplit;
  fullABToggle.disabled = !ready || !isAB;
  fullCanvas.style.cursor = ready && isSplit ? 'ew-resize' : 'crosshair';
  updateFullABToggle(dom, state);
}

export function updateSplitFromEvent(event, dom, onChange) {
  const { previewCanvas } = dom.canvases;
  const { previewSplitRange } = dom.inputs;
  const { previewSplitValue } = dom.values;
  const rect = previewCanvas.getBoundingClientRect();
  const x = clamp(event.clientX - rect.left, 0, rect.width || 1);
  const ratio = rect.width ? x / rect.width : 0.5;
  const value = Math.round(ratio * 100);
  previewSplitRange.value = value;
  if (previewSplitValue) previewSplitValue.textContent = value;
  onChange();
}

export function updateFullSplitFromEvent(event, dom, onChange) {
  const { fullCanvas } = dom.canvases;
  const { fullSplitRange } = dom.inputs;
  const { fullSplitValue } = dom.values;
  const rect = fullCanvas.getBoundingClientRect();
  const x = clamp(event.clientX - rect.left, 0, rect.width || 1);
  const ratio = rect.width ? x / rect.width : 0.5;
  const value = Math.round(ratio * 100);
  fullSplitRange.value = value;
  if (fullSplitValue) fullSplitValue.textContent = value;
  onChange();
}

export function updatePreviewABToggle(dom, state) {
  const { previewABToggle } = dom.inputs;
  if (!previewABToggle) return;
  previewABToggle.textContent = state.previewABState === 'A' ? 'Show B' : 'Show A';
}

export function updateFullABToggle(dom, state) {
  const { fullABToggle } = dom.buttons;
  if (!fullABToggle) return;
  if (!state.tunedReady) {
    fullABToggle.textContent = 'Show Original';
    return;
  }
  fullABToggle.textContent = state.fullABState === 'A' ? 'Show Result' : 'Show Original';
}
