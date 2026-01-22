import { loadImage } from './imageLoader.js';
import { initPreviewSelector } from './previewSelector.js';
import { createSliders } from './ui/sliders.js';
import { smoothRegion } from './smoothing/smoother.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let originalImage = null;
let previewRegion = null;

document.getElementById('upload').onchange = e => {
  loadImage(e.target.files[0], canvas, ctx).then(img => {
    originalImage = img;
    previewRegion = null;
  });
};

initPreviewSelector(canvas, region => {
  previewRegion = region;
  applyPreview();
});

const sliders = createSliders(document.getElementById('controls'), applyPreview);

function applyPreview() {
  if (!originalImage || !previewRegion) return;

  ctx.drawImage(originalImage, 0, 0);

  const imgData = ctx.getImageData(
    previewRegion.x,
    previewRegion.y,
    previewRegion.w,
    previewRegion.h
  );

  const smoothed = smoothRegion(imgData, sliders.values());
  ctx.putImageData(smoothed, previewRegion.x, previewRegion.y);
}

document.getElementById('applyFull').onclick = () => {
  if (!originalImage) return;

  ctx.drawImage(originalImage, 0, 0);
  const img = ctx.getImageData(0,0,canvas.width,canvas.height);
  ctx.putImageData(smoothRegion(img, sliders.values()), 0, 0);
};
