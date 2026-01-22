export function initPreviewSelector(canvas, onSelect) {
  let start = null;

  canvas.onmousedown = e => {
    start = getPos(e);
  };

  canvas.onmouseup = e => {
    if (!start) return;
    const end = getPos(e);
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(start.x - end.x);
    const h = Math.abs(start.y - end.y);

    if (w > 4 && h > 4) onSelect({ x, y, w, h });
    start = null;
  };

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.floor(e.clientX - r.left),
      y: Math.floor(e.clientY - r.top)
    };
  }
}
