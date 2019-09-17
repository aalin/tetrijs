const lerp = require('../utils');

function palette256(r, g, b) {
  if (r === 0 && g === 0 && b === 0) {
    return 0;
  }

  if (isGray(r, g, b)) {
    return 232 + Math.floor((r + g + b) / 33.0);
  }

  return (
    16 +
    Math.floor((6 * r) / 256.0) * 36 +
    Math.floor((6 * g) / 256.0) * 6 +
    Math.floor((6 * b) / 256.0) * 1
  );
}

function isGray(r, g, b, sep = 0.0) {
  if (r < sep || g < sep || b < sep) {
    return r < sep && g < sep && b < sep;
  }

  return isGray(r, g, b, sep + 42.5);
}

const colors16 = [
  [0x00, 0x00, 0x00],
  [0xaa, 0x00, 0x00],
  [0x00, 0xaa, 0x00],
  [0xaa, 0x55, 0x00],
  [0x00, 0x00, 0xaa],
  [0xaa, 0x00, 0xaa],
  [0x00, 0xaa, 0xaa],
  [0xaa, 0xaa, 0xaa],
  [0x55, 0x55, 0x55],
  [0xff, 0x55, 0x55],
  [0x55, 0xff, 0x55],
  [0xff, 0xff, 0x55],
  [0x55, 0x55, 0xff],
  [0xff, 0x55, 0xff],
  [0x55, 0xff, 0xff],
  [0xff, 0xff, 0xff],
];

function colorDistance(c1, c2) {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
      Math.pow(c1[1] - c2[1], 2) +
      Math.pow(c1[2] - c2[2], 2)
  );
}

function color16index(color) {
  let distance = Infinity;
  let index = 0;

  colors16.forEach((test, i) => {
    const dist = colorDistance(color, test);

    if (dist < distance) {
      distance = dist;
      index = i;
    }
  });

  return index;
}

function palette16(r, g, b) {
  const index = color16index([r, g, b]);
  const base = index < 8 ? 0 : 60;
  return base + (index % 8);
}

function paletteGrayscale(value) {
  const bg = lerp(231, 256, value);

  if (bg < 232) {
    return 0;
  }

  if (bg >= 255) {
    return 15;
  }

  return Math.floor(bg);
}

module.exports = {
  palette256,
  palette16,
  paletteGrayscale,
};
