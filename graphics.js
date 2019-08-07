const Tetrominos = require('./tetromino');
const palette256 = require('./display/palette').palette256;

function drawPiece(display, index, rotation, left, top, xPos, yPos) {
  const tetromino = Tetrominos.get(index);
  const data = tetromino.getRotation(rotation);
  const halfSize = tetromino.halfSize;

  for (let y = 0; y < tetromino.size; y++) {
    for (let x = 0; x < tetromino.size; x++) {
      if (data[y][x]) {
        display.setCursorPosition(
          Math.floor(left + (xPos + x - halfSize) * 2),
          Math.floor(top + yPos + y - halfSize)
        );

        display.printText("[]", { bg: tetromino.color, fg: 15 })
      }
    }
  }
}

function drawContent(display, data, shadowedColumns, width, left, top) {
  const height = data.length / width;

  const text = '[]';
  const shadowedText = '⟦⟧';

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const color = data[y * width + x];

      if (color) {
        display.setCursorPosition(left + x * 2, top + y);

        if (shadowedColumns[0] === x) {
          display.printText(shadowedText, { bg: color, fg: 7 });
          shadowedColumns.shift();
        } else {
          display.printText(text, { bg: color, fg: 15 });
        }
      }
    }

    if (shadowedColumns[0] === x) {
      shadowedColumns.shift();
    }
  }
}

function drawFrame(display, top, right, bottom, left) {
  const t = new Date().getTime() / 1000.0;
  const scale = 1.0;
  const r = 2;
  const r2 = r * 2;
  const plasmaOffset = 0;

  for (let y = Math.ceil(top - r, 0); y <= top; y++) {
    for (let x = left - r2; x <= right + r2; x++) {
      const value = plasma(x, y, t, scale) + plasmaOffset;

      display
        .setCursorPosition(x, y)
        .putCell(' ', { bg: palette256(...rgbpalette(value)) });
    }
  }

  for (let y = top; y < bottom; y++) {
    for (let x = left - r2; x <= left; x++) {
      const value = plasma(x, y, t, scale) + plasmaOffset;

      display
        .setCursorPosition(x, y)
        .putCell(' ', { bg: palette256(...rgbpalette(value)) });
    }
  }

  for (let y = top; y < bottom; y++) {
    for (let x = right; x <= right + r2; x++) {
      const value = plasma(x, y, t, scale) + plasmaOffset;

      display
        .setCursorPosition(x, y)
        .putCell(' ', { bg: palette256(...rgbpalette(value)) });
    }
  }

  for (let y = bottom; y <= bottom + r; y++) {
    for (let x = left - r2; x <= right + r2; x++) {
      const value = plasma(x, y, t, scale) + plasmaOffset;

      display
        .setCursorPosition(x, y)
        .putCell(' ', { bg: palette256(...rgbpalette(value)) });
    }
  }
}

const BOX_CHARS = ['═', '║', '╔', '╗', '╚', '╝'];

function drawFrameOld(display, top, right, bottom, left) {
  const attrs = { fg: 15, bg: 0 };

  for (let x = left + 1; x < right; x++) {
    display
      .setCursorPosition(x, top)
      .putCell(BOX_CHARS[0], attrs)
      .setCursorPosition(x, bottom)
      .putCell(BOX_CHARS[0], attrs)
  }

  for (let y = top + 1; y < bottom; y++) {
    display
      .setCursorPosition(left, y)
      .putCell(BOX_CHARS[1], attrs)
      .setCursorPosition(right, y)
      .putCell(BOX_CHARS[1], attrs)
  }

  display
    .setCursorPosition(left, top)
    .putCell(BOX_CHARS[2], attrs)
    .setCursorPosition(right, top)
    .putCell(BOX_CHARS[3], attrs)
    .setCursorPosition(left, bottom)
    .putCell(BOX_CHARS[4], attrs)
    .setCursorPosition(right, bottom)
    .putCell(BOX_CHARS[5], attrs)
}

function rgbpalette(x, fn = x => x) {
  return Array.from( { length: 3 }, (_, i) => (
    Math.floor(
      256 * Math.sin((x + i / 3.0) * Math.PI) ** 2
    )
  ));
}

function plasma(x, y, t, scale = 1.0) {
  return (
    Math.sin(x / 16.0 * scale + t) +
    Math.sin(y / 8.0 * scale + t) +
    Math.sin((x + y + t) / 16.0 * scale) +
    Math.sin(Math.sqrt(x * x + y * y) / 8.0 * scale) +
    4
  ) / 8.0;
}

function drawBackground(display, top, right, bottom, left) {
  const w = right - left;
  const h = bottom - top;

  const t = new Date().getTime() / 1000.0;

  const scale = 1.0;

  for (let y = top + 1; y < bottom; y++) {
    for (let x = left + 1; x < right; x++) {
      const value = plasma(x, y, t, scale);

      const char = ' ';

      display
        .setCursorPosition(x, y)
        .putCell(char, { bg: palette256(...rgbpalette(value).map(v => v * 0.5)) });
    }
  }
}

module.exports = {
  drawPiece,
  drawContent,
  drawBackground,
  drawFrame,
};
