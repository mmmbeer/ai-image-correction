export function createState() {
  return {
    imageLoaded: false,
    previewRegion: null,
    previewZoom: 1,
    fullZoom: 1,
    previewStale: false,
    isRendering: false,
    renderQueued: false,
    baseReady: false,
    previewABState: 'B',
    fullABState: 'B',
    tunedReady: false,
    isSplitDragging: false,
    isFullSplitDragging: false
  };
}
