export function getDom() {
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

  const uploadInput = document.getElementById('upload');
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

  return {
    canvases: {
      fullCanvas,
      previewCanvas,
      previewCanvasWrap,
      previewBox,
      activePreviewBox,
      fullImage,
      bufferCanvas,
      basePreviewCanvas,
      edgeCanvas,
      baseCanvas,
      tunedCanvas
    },
    contexts: {
      fullCtx,
      previewCtx,
      bufferCtx,
      basePreviewCtx,
      edgeCtx,
      baseCtx,
      tunedCtx
    },
    elements: {
      previewPanel,
      previewActiveBadge,
      previewStaleBadge,
      previewSizeTag,
      previewSettingsToggle,
      previewSettings,
      previewSplitControls,
      previewABControls,
      labAdvancedControls,
      fullSplitControls,
      fullABControls
    },
    inputs: {
      uploadInput,
      selectionMode,
      previewAutoSizeInput,
      previewWidthInput,
      previewHeightInput,
      aspectLockInput,
      zoomButtons,
      pixelGridInput,
      controlToggles,
      radiusRange,
      sigmaColorRange,
      smoothingModeInput,
      chromaPresetInput,
      lumaPreserveRange,
      chromaSmoothRange,
      chromaSmoothARange,
      chromaSmoothBRange,
      chromaRadiusRange,
      chromaSigmaSpaceRange,
      chromaSigmaColorRange,
      chromaClampRange,
      neutralProtectRange,
      lumaProtectRange,
      adaptiveChromaRange,
      protectSkinInput,
      artifactBoostRange,
      previewModeInput,
      previewSplitRange,
      previewABToggle,
      labAdvancedToggle,
      fullCompareMode,
      fullSplitRange,
      edgeDetectInput,
      edgeOverlayInput,
      outlineOverlayInput,
      edgeKernelInput,
      edgeSensitivityRange,
      edgeThresholdRange,
      edgePreblurRange,
      edgeInfluenceRange,
      edgeFalloffInput,
      edgeOverlayModeInput,
      edgeOverlayOpacityRange,
      edgeViewInput,
      outlineModeInput,
      outlineThresholdRange,
      outlineThicknessRange,
      outlineThinInput,
      outlineColorInput,
      outlineMergeInput,
      outlineMergeStrengthRange,
      outlineBlendModeInput,
      edgeStrengthRange,
      edgeSmoothRange,
      edgeSoftenRange,
      paletteLevelsRange,
      neighborMergeRange
    },
    values: {
      radiusValue,
      sigmaColorValue,
      lumaPreserveValue,
      chromaSmoothValue,
      chromaSmoothAValue,
      chromaSmoothBValue,
      chromaRadiusValue,
      chromaSigmaSpaceValue,
      chromaSigmaColorValue,
      chromaClampValue,
      neutralProtectValue,
      lumaProtectValue,
      adaptiveChromaValue,
      artifactBoostValue,
      previewSplitValue,
      paletteLevelsValue,
      neighborMergeValue,
      edgeStrengthValue,
      edgeSmoothValue,
      edgeSoftenValue,
      edgeSensitivityValue,
      edgeThresholdValue,
      edgePreblurValue,
      edgeInfluenceValue,
      edgeOverlayOpacityValue,
      outlineThresholdValue,
      outlineThicknessValue,
      outlineMergeStrengthValue,
      fullSplitValue
    },
    buttons: {
      resetPreviewButton,
      applyFullButton,
      fullABToggle
    }
  };
}
