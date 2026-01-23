export function formatRegion(region) {
  return `Region ${region.w}x${region.h} at ${region.x},${region.y}`;
}

export function formatZoom(zoom) {
  if (Math.abs(zoom - Math.round(zoom)) < 0.01) {
    return Math.round(zoom).toString();
  }
  return zoom.toFixed(2);
}

export function clampRegion(region, maxW, maxH) {
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

export function getCanvasMetrics(canvas) {
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
