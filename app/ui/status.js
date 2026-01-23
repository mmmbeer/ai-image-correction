export function setPreviewActive(dom, active) {
  const { previewPanel, previewActiveBadge } = dom.elements;
  previewPanel.classList.toggle('is-active', active);
  previewActiveBadge.textContent = active ? 'Preview Active' : 'Preview Inactive';
  previewActiveBadge.classList.toggle('badge-success', active);
  previewActiveBadge.classList.toggle('badge-danger', !active);
}

export function setPreviewStale(dom, state, stale) {
  const { previewStaleBadge } = dom.elements;
  state.previewStale = stale;
  previewStaleBadge.style.display = stale && state.previewRegion ? 'inline-flex' : 'none';
}

export function setBusy(dom, busy) {
  const { previewPanel } = dom.elements;
  const { applyFullButton, resetPreviewButton } = dom.buttons;
  previewPanel.classList.toggle('is-busy', busy);
  applyFullButton.disabled = busy;
  resetPreviewButton.disabled = busy;
}
