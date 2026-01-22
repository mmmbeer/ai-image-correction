export function quantize(img, levels) {
  const step = 255 / levels;
  const d = img.data;

  for (let i=0;i<d.length;i+=4) {
    d[i]   = Math.round(d[i]/step)*step;
    d[i+1] = Math.round(d[i+1]/step)*step;
    d[i+2] = Math.round(d[i+2]/step)*step;
  }
  return img;
}
