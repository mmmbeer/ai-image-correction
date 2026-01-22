// utils/math.js

// Clamp a value to a range
export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

// Linear interpolation
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Gaussian function (used by bilateral filters)
export function gaussian(x, sigma) {
  return Math.exp(-(x * x) / (2 * sigma * sigma));
}

// Euclidean distance in RGB space
export function rgbDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Convert sRGB (0–255) to linear RGB (0–1)
export function srgbToLinear(c) {
  c /= 255;
  return c <= 0.04045
    ? c / 12.92
    : Math.pow((c + 0.055) / 1.055, 2.4);
}

// Convert linear RGB (0–1) to sRGB (0–255)
export function linearToSrgb(c) {
  const v = c <= 0.0031308
    ? c * 12.92
    : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return clamp(Math.round(v * 255), 0, 255);
}

// RGB → LAB (D65)
export function rgbToLab(r, g, b) {
  let R = srgbToLinear(r);
  let G = srgbToLinear(g);
  let B = srgbToLinear(b);

  // XYZ
  let X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  let Y = R * 0.2126729 + G * 0.7151522 + B * 0.0721750;
  let Z = R * 0.0193339 + G * 0.1191920 + B * 0.9503041;

  // D65 reference white
  X /= 0.95047;
  Z /= 1.08883;

  const f = t =>
    t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + 16 / 116;

  const fx = f(X);
  const fy = f(Y);
  const fz = f(Z);

  return {
    L: (116 * fy) - 16,
    A: 500 * (fx - fy),
    B: 200 * (fy - fz)
  };
}

// LAB → RGB
export function labToRgb(L, A, B) {
  let fy = (L + 16) / 116;
  let fx = fy + A / 500;
  let fz = fy - B / 200;

  const fInv = t => {
    const t3 = t * t * t;
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
  };

  let X = fInv(fx) * 0.95047;
  let Y = fInv(fy);
  let Z = fInv(fz) * 1.08883;

  // XYZ → linear RGB
  let R =  3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
  let G = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
  let Bc = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;

  return {
    r: linearToSrgb(R),
    g: linearToSrgb(G),
    b: linearToSrgb(Bc)
  };
}
