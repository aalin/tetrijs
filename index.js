const Input = require('./input');
const Engine = require('./engine.js');
const Tetrominos = require('./tetromino');

const palette256 = require('./display/palette').palette256;

function drawPiece(display, index, rotation, left, top, xPos, yPos) {
  const tetromino = Tetrominos.get(index);
  const data = tetromino.getRotation(rotation);

  for (let y = 0; y < tetromino.size; y++) {
    for (let x = 0; x < tetromino.size; x++) {
      if (data[y][x]) {
        display.setCursorPosition(left + (xPos + x) * 2, top + yPos + y);
        display.printText("[]", { bg: tetromino.color, fg: 15 })
      }
    }
  }
}

const BOX_CHARS = ['═', '║', '╔', '╗', '╚', '╝'];

function drawFrame(display, top, right, bottom, left) {
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

function drawBackground(display, top, right, bottom, left) {
  const w = right - left;
  const h = bottom - top;

  const t = new Date().getTime() / 1000.0;

  const scale = 2.2;

  for (let y = top + 1; y < bottom; y++) {
    for (let x = left + 1; x < right; x++) {
      const value = (
        Math.sin(x / 16.0 * scale + t) +
        Math.sin(y / 8.0 * scale + t) +
        Math.sin((x + y + t) / 16.0 * scale) +
        Math.sin(Math.sqrt(x * x + y * y) / 8.0 * scale) +
        4
      ) / 8.0;

      display.setCursorPosition(x, y).putCell(' ', { bg: palette256(...rgbpalette(value).map(f => f * 0.5)) });
    }
  }
}

class Timer {
  constructor(interval = 1000) {
    this._lastUpdate = null;
    this._interval = interval;
  }

  reset() {
    this._lastUpdate = null;
  }

  update() {
    const now = new Date().getTime();

    if (!this._lastUpdate || now - this._lastUpdate > this._interval) {
      this._lastUpdate = now;
      return true;
    }

    return false;
  }
}

class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  doesTetrominoFit(tetrominoData, x, y) {
    return true;
  }
}

class GameState {
  constructor() {
    this.keys = '';
    this.timer = new Timer(1000);

    this.pieceX = 5;
    this.pieceY = 0;
    this.pieceRotation = 0;
    this.pieceId = 0;

    this.grid = new Grid(10, 20);
  }

  start() {
  }

  stop() {
  }

  update(engine, keys) {
    for (let key of keys) {
      switch (key) {
        case Input.KEYS.BACKSPACE:
          this.keys = this.keys.substr(0, this.keys.length - 1);
          break;
        case Input.KEYS.LEFT:
        case 'j':
          this.pieceX = Math.max(0, this.pieceX - 1);
          break;
        case Input.KEYS.RIGHT:
        case 'l':
          this.pieceX = Math.min(this.grid.width, this.pieceX + 1);
          break;
        case ' ':
        case 'k':
          this.pieceRotation++;
          this.pieceRotation %= 4;
          break;
        default:
          if (/^\d$/.test(key)) {
            this.pieceId = Number(key);
            this.pieceY = 0;
          }

          this.keys += key;
          break;
      }
    }

    if (this.timer.update()) {
      this.pieceY += 1;
    }
  }

  draw(engine, display) {
    const lines = this.keys.split('\r');

    const now = new Date().getTime();

    const index = this.pieceId;
    const rotation = this.pieceRotation;

    const center = Math.ceil(display.cols / 2);
    const left = center - this.grid.width;
    const right = center + this.grid.height;

    display.hideCursor();

    display.setCursorPosition(0, 1).printText(`str: ${JSON.stringify(this.keys)}`)
    display.setCursorPosition(0, 2).printText(`index: ${index % Tetrominos.length} rotation: ${rotation % 4}`);
    display.setCursorPosition(0, 3).printText(`X: ${this.pieceX} Y: ${this.pieceY}`);

    /*
    display
      .setCursorPosition(1, 1)
      .printText(`Tetrijs ${this.keys}`, { fg: 16 + Math.floor(now / 250) % (255-16) });
    */

    drawBackground(display, 2, right, 2 + this.grid.height, left);
    drawFrame(display, 2, right, 2 + this.grid.height, left);

    drawPiece(display, index, this.pieceRotation, left, 3, this.pieceX, this.pieceY);

    /*
    drawPiece(display, index + 1, rotation, 10, 5);
    drawPiece(display, index + 2, rotation, 20, 5);
    drawPiece(display, index + 3, rotation, 0, 15);
    drawPiece(display, index + 4, rotation, 10, 15);
    drawPiece(display, index + 5, rotation, 20, 15);
    */
    //display.setCursorPosition(0, 0)
  }
}

Engine.run(new GameState());
