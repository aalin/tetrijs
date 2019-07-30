const Input = require('./input');
const Engine = require('./engine.js');
const Tetrominos = require('./tetromino');

const palette256 = require('./display/palette').palette256;

function drawPiece(display, index, rotation, left, top, xPos, yPos) {
  const tetromino = Tetrominos.get(index);
  const data = tetromino.getRotation(rotation);
  const halfSize = tetromino.halfSize;

  for (let y = 0; y < tetromino.size; y++) {
    for (let x = 0; x < tetromino.size; x++) {
      if (data[y][x]) {
        display.setCursorPosition(Math.floor(left + 1 + (xPos - tetromino.size / 2 + x) * 2), top + yPos + y);
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

      const char = ' ';

      display.setCursorPosition(x, y).putCell(char, { bg: palette256(...rgbpalette(value)) });
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
    this.data = Array.from({ length: width * height }, () => 0);

    this.timer = new Timer(1000);

    this.pieceX = Math.floor(width / 2);
    this.pieceY = 0;

    this.pieceRotation = 0;
    this.pieceId = 0;
  }

  start() {
    this.setPiece(Math.floor(Math.random() * Tetrominos.length));
  }

  stop() {
  }

  moveRight() {
    this.pieceX++;
  }

  moveLeft() {
    this.pieceX--;
  }

  rotateRight() {
    this.pieceRotation = (this.pieceRotation + 1) % 4;
  }

  rotateLeft() {
    this.pieceRotation = (4 + this.pieceRotation - 1) % 4;
  }

  setPiece(id) {
    this.pieceId = id;
    this.pieceY = 0;
    this.timer.reset();
  }

  update() {
    this.pieceX += this.pieceCollisionOffset(this.pieceId, this.pieceRotation, this.pieceX);

    if (this.timer.update()) {
      this.pieceY++;
    }
  }

  draw(display) {
    const halfWidth = this.width / 2;
    const center = Math.ceil(display.cols / 2);
    const left = center - halfWidth * 2;
    const right = center + halfWidth * 2;

    drawBackground(display, 2, right + 1, 2 + this.height, left);
    drawFrame(display, 2, right + 1, 2 + this.height, left);
    drawPiece(display, this.pieceId, this.pieceRotation, left, 3, this.pieceX, this.pieceY);
  }

  pieceCollisionOffset(pieceId, rotation, pieceX) {
    const tetromino = Tetrominos.get(pieceId);
    const data = tetromino.getRotation(rotation);

    for (let x = 0; x < data.length; x++) {
      for (let y = 0; y < data.length; y++) {
        if (!data[y][x]) {
          continue;
        }

        const leftDiff = x + pieceX - tetromino.size / 2;

        if (leftDiff < 0) {
          return -leftDiff;
        }
      }
    }

    for (let x = data.length - 1; x >= 0; x--) {
      for (let y = 0; y < data.length; y++) {
        if (!data[y][x]) {
          continue;
        }

        const right = x + pieceX - tetromino.size / 2 + 1;

        if (right > this.width) {
          return this.width - right;
        }
      }
    }

    return 0;
  }
}

class GameState {
  constructor() {
    this.keys = '';
    this.grid = new Grid(15, 30);
  }

  start() {
    this.grid.start();
  }

  stop() {
    this.grid.stop();
  }

  update(engine, keys) {
    for (let key of keys) {
      switch (key) {
        case Input.KEYS.BACKSPACE:
          this.keys = this.keys.substr(0, this.keys.length - 1);
          break;
        case Input.KEYS.LEFT:
        case 'j':
        case 'J':
          this.grid.moveLeft();
          break;
        case Input.KEYS.RIGHT:
        case 'l':
        case 'L':
          this.grid.moveRight();
          break;
        case ' ':
        case 'k':
        case 'z':
          this.grid.rotateRight();
          break;
        case 'K':
        case 'Z':
          this.grid.rotateLeft();
          break;
        default:
          if (/^\d$/.test(key)) {
            this.grid.setPiece(Number(key));
          }

          this.keys += key;
          break;
      }
    }

    this.grid.update();
  }

  draw(engine, display) {
    const lines = this.keys.split('\r');

    const now = new Date().getTime();

    const index = this.grid.pieceId;
    const rotation = this.grid.pieceRotation;

    display.hideCursor();

    display.setCursorPosition(0, 1).printText(`str: ${JSON.stringify(this.keys)}`)
    display.setCursorPosition(0, 2).printText(`index: ${index % Tetrominos.length} rotation: ${rotation % 4}`);
    display.setCursorPosition(0, 3).printText(`X: ${this.pieceX} Y: ${this.pieceY}`);

    /*
    display
      .setCursorPosition(1, 1)
      .printText(`Tetrijs ${this.keys}`, { fg: 16 + Math.floor(now / 250) % (255-16) });
    */

    this.grid.draw(display);

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
