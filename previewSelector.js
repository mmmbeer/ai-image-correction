export function initPreviewSelector({
  canvas,
  previewBox,
  isEnabled,
  getMode,
  getFixedSize,
  isAspectLocked,
  getAspectRatio,
  onHover,
  onSelect
}) {
  let dragStart = null;
  let lastHover = null;
  let lastSize = null;

  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('mousedown', handleDown);
  canvas.addEventListener('mouseup', handleUp);
  canvas.addEventListener('mouseleave', handleLeave);

  function handleMove(e) {
    if (!isEnabled()) {
      hideBox();
      return;
    }

    const pos = getPos(e);
    const mode = getMode();

    if (mode === 'drag' && dragStart) {
      const region = clampRegion(buildDragRegion(pos), canvas.width, canvas.height);
      lastHover = region;
      showBox(region);
      onHover?.(region);
      return;
    }

    const size = mode === 'fixed' ? getFixedSize() : (lastSize || getFixedSize());
    const region = clampRegion(buildHoverRegion(pos, size), canvas.width, canvas.height);
    lastHover = region;
    showBox(region);
    onHover?.(region);
  }

  function handleDown(e) {
    if (!isEnabled()) return;
    if (getMode() !== 'drag') return;
    dragStart = getPos(e);
  }

  function handleUp(e) {
    if (!isEnabled()) return;

    if (getMode() === 'drag') {
      if (!dragStart) return;
      const pos = getPos(e);
      const region = clampRegion(buildDragRegion(pos), canvas.width, canvas.height);
      dragStart = null;
      lastHover = region;
      lastSize = { w: region.w, h: region.h };
      onSelect?.(region);
      return;
    }

    if (lastHover) {
      lastSize = { w: lastHover.w, h: lastHover.h };
      onSelect?.(lastHover);
    }
  }

  function handleLeave() {
    dragStart = null;
    hideBox();
  }

  function buildHoverRegion(pos, size) {
    const w = Math.max(1, Math.floor(size.w));
    const h = Math.max(1, Math.floor(size.h));
    return {
      x: Math.round(pos.x - w / 2),
      y: Math.round(pos.y - h / 2),
      w,
      h
    };
  }

  function buildDragRegion(pos) {
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    let w = Math.max(1, Math.abs(dx));
    let h = Math.max(1, Math.abs(dy));

    if (isAspectLocked()) {
      const ratio = getAspectRatio();
      if (ratio > 0) {
        if (w / h > ratio) {
          h = Math.max(1, Math.round(w / ratio));
        } else {
          w = Math.max(1, Math.round(h * ratio));
        }
      }
    }

    const x = dx < 0 ? dragStart.x - w : dragStart.x;
    const y = dy < 0 ? dragStart.y - h : dragStart.y;

    return { x, y, w, h };
  }

  function clampRegion(region, maxW, maxH) {
    let w = Math.max(1, Math.min(region.w, maxW));
    let h = Math.max(1, Math.min(region.h, maxH));
    let x = Math.max(0, Math.min(region.x, maxW - w));
    let y = Math.max(0, Math.min(region.y, maxH - h));

    return {
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: Math.round(h)
    };
  }

  function showBox(region) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? rect.width / canvas.width : 1;
    const scaleY = rect.height ? rect.height / canvas.height : 1;

    previewBox.style.display = 'block';
    previewBox.style.left = `${region.x * scaleX}px`;
    previewBox.style.top = `${region.y * scaleY}px`;
    previewBox.style.width = `${region.w * scaleX}px`;
    previewBox.style.height = `${region.h * scaleY}px`;
  }

  function hideBox() {
    previewBox.style.display = 'none';
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.floor((e.clientX - rect.left) * scaleX),
      y: Math.floor((e.clientY - rect.top) * scaleY)
    };
  }
}
