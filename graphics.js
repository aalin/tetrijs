const { log } = require('./utils');
const Tetrominos = require('./tetromino');
const palette256 = require('./display/palette').palette256;

function* eachPiecePosition(index, rotation, xPos = 0, yPos = 0) {
  const tetromino = Tetrominos.get(index);
  const data = tetromino.getRotation(rotation);
  const halfSize = tetromino.halfSize;

  for (let y = 0; y < tetromino.size; y++) {
    for (let x = 0; x < tetromino.size; x++) {
      if (data[y][x]) {
        yield [
          xPos + x - halfSize,
          yPos + y - halfSize,
          tetromino,
        ];
      }
    }
  }
}

function drawPiece(display, index, rotation, left, top, xPos, yPos) {
  for (let [x, y, tetromino] of eachPiecePosition(index, rotation, xPos, yPos)) {
    display.setCursorPosition(
      Math.floor(left + x * 2),
      Math.floor(top + y)
    );

    display.printText("[]", { bg: tetromino.color, fg: 15 })
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

const GAME_OVER_TEXT = `
  e88'Y88                                  e88 88e
 d888  'Y   ,"Y88b 888 888 8e   ,e e,     d888 888b  Y8b Y888P  ,e e,  888,8,
C8888 eeee "8" 888 888 888 88b d88 88b   C8888 8888D  Y8b Y8P  d88 88b 888 "
 Y888 888P ,ee 888 888 888 888 888   ,    Y888 888P    Y8b "   888   , 888
  "88 88"  "88 888 888 888 888  "YeeP"     "88 88"      Y8P     "YeeP" 888`

function drawGameOverScreen(display) {
  const t = new Date().getTime() / 1000.0;
  const scale = 0.2;

  const indexes = [];

  for (let y = 0; y < display.rows; y++) {
    for (let x = 0; x < display.cols; x++) {
      const value = plasma(x, y, t / 4.0, scale);
      const char = ' ';

      let alpha = 0.5;

      display
        .setCursorPosition(x, y)
        .putCell(char, { bg: palette256(...rgbpalette(value).map(v => v * alpha)) });
    }
  }

  for (let i = 0; i < 16; i++) {
    const r = (Math.sin(i / 4.0 * Math.PI) + 1.0) / 2.0;
    const rotation = (Math.floor(t / 2.0 + r) % 4);

    const yPos = Math.floor(
     Math.floor(t) + ((Math.sin(i / 4.0 * Math.PI) + 1.0) / 2.0) * display.rows,
    ) % display.rows;

    const offset = Math.floor(display.cols * 0.2);
    const xPos = Math.floor(((i / 16) * (display.cols - offset / 2) + offset / 2) / 2);

    const char = ' ';

    for (let [x, y] of eachPiecePosition(i, rotation, xPos, yPos)) {
      if (y < 0) {
        continue;
      }

      y %= display.rows;

      const value = plasma(x * 2, y, t / 4.0, scale);
      const alpha = 0.3;
      const bg =  palette256(...rgbpalette(value).map(v => v * alpha));

      try {
        display
          .setCursorPosition(x * 2, y)
          .printText('  ', { bg })
      } catch (e) {
        log(e.message);
        log(JSON.stringify(e.stack));
      }
    }

    const lines = GAME_OVER_TEXT.split('\n');

    while (lines[0].trim() === '') {
      lines.shift();
    }

    const textWidth = lines.reduce((acc, obj) => Math.max(acc, obj.length), 0);
    const textLeft = Math.floor(display.cols / 2 - textWidth / 2);
    const textTop = Math.floor(display.rows / 2 - lines.length / 2);

    for (let y = 0; y < lines.length; y++) {
      const fg = 15;

      display
        .setCursorPosition(textLeft, textTop + y)
        .printText(lines[y], { fg })
    }

    const text = 'Press space to start';

    display
      .setCursorPosition(
        Math.floor(display.cols / 2 - text.length / 2),
        textTop + lines.length + 2
      )
      .printText(text, { fg: 15 })
  }
}

module.exports = {
  drawPiece,
  drawContent,
  drawBackground,
  drawFrame,
  drawGameOverScreen,
};
