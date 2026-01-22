export function loadImage(file, canvas, ctx) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      resolve(img);
    };
    img.src = URL.createObjectURL(file);
  });
}
