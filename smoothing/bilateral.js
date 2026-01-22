export function bilateralFilter(img, opts) {
  const { radius, sigmaColor, sigmaSpace } = opts;
  const { data, width, height } = img;
  const out = new Uint8ClampedArray(data.length);

  const gauss = (d, s) => Math.exp(-(d*d)/(2*s*s));

  for (let y=0;y<height;y++) {
    for (let x=0;x<width;x++) {
      const i=(y*width+x)*4;
      let r=0,g=0,b=0,wSum=0;

      for (let dy=-radius;dy<=radius;dy++) {
        for (let dx=-radius;dx<=radius;dx++) {
          const nx=x+dx, ny=y+dy;
          if(nx<0||ny<0||nx>=width||ny>=height) continue;

          const ni=(ny*width+nx)*4;
          const dr=data[ni]-data[i];
          const dg=data[ni+1]-data[i+1];
          const db=data[ni+2]-data[i+2];

          const wc = gauss(Math.sqrt(dr*dr+dg*dg+db*db), sigmaColor);
          const ws = gauss(Math.sqrt(dx*dx+dy*dy), sigmaSpace);
          const w = wc*ws;

          r+=data[ni]*w;
          g+=data[ni+1]*w;
          b+=data[ni+2]*w;
          wSum+=w;
        }
      }

      out[i]=r/wSum;
      out[i+1]=g/wSum;
      out[i+2]=b/wSum;
      out[i+3]=data[i+3];
    }
  }

  return new ImageData(out, width, height);
}

