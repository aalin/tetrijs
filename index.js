const Input = require('./input');
const Engine = require('./engine.js');
const Tetrominos = require('./tetromino');

function log(...args) {
  process.stderr.write(args.map(String).join(' ') + '\n');
}

const palette256 = require('./display/palette').palette256;

const SCORES = [40, 100, 300, 1200];

function calculateScore(level, lines) {
  return SCORES[Math.min(lines, SCORES.length - 1)] * (level + 1);
}

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

const SPEEDS = [800, 720, 630, 550, 470, 380, 300, 220, 130, 100, 80, 80, 80, 70, 70, 70, 50];

class Timer {
  constructor(interval = 1000) {
    this._lastUpdate = null;
    this._interval = interval;
  }

  setInterval(interval) {
    this._interval = interval;
  }

  reset() {
    this._lastUpdate = null;
    return this;
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

    this.data = Array.from({ length: width * height }, (_, i) => {
      const y = Math.floor(i / width);
      const x = i % width;

      if (y > height - 5) {
        if (x !== 2) {
          return 1;
        }
      }

      return 0;
    });

    this.tetrisRandom = null;
    this.score = 0;
    this.clearedLines = 0;

    this.timer = new Timer(800);

    this.pieceX = Math.floor(width / 2);
    this.pieceY = 0;

    this.pieceRotation = 0;
    this.pieceId = 0;
  }

  start() {
    this.clearedLines = 0;
    this.timer.setInterval(SPEEDS[Math.min(SPEEDS.length - 1, Math.floor(this.clearedLines / 10))]);
    this.score = 0;
    this.tetrisRandom = Tetrominos.randomizer();
    this.nextPiece();
  }

  stop() {
  }

  moveRight() {
    if (this.pieceCollidesAt(this.pieceX + 1, this.pieceY)) {
      return;
    }

    this.pieceX++;
    this.timer.reset().update();
  }

  moveLeft() {
    if (this.pieceCollidesAt(this.pieceX - 1, this.pieceY)) {
      return;
    }

    this.pieceX--;
    this.timer.reset().update();
  }

  hardDrop() {
    while (true) {
      if (this.pieceCollidesAt(this.pieceX, this.pieceY + 1)) {
        break;
      }

      this.pieceY++;
    }

    this.timer.reset().update();
  }

  rotateRight() {
    this.rotate(1);
  }

  rotateLeft() {
    this.rotate(-1);
  }

  rotate(direction) {
    const nextRotation = (4 + this.pieceRotation + direction) % 4;

    if (!this.pieceCollidesAt(this.pieceX, this.pieceY, nextRotation)) {
      this.pieceRotation = nextRotation;
      return;
    }

    if (!this.pieceCollidesAt(this.pieceX - 1, this.pieceY, nextRotation)) {
      this.pieceRotation = nextRotation;
      this.pieceX--;
      return;
    }

    if (!this.pieceCollidesAt(this.pieceX + 1, this.pieceY, nextRotation)) {
      this.pieceRotation = nextRotation;
      this.pieceX++;
      return;
    }
  }

  setPiece(id) {
    this.pieceId = id;
    this.pieceY = 0;
    this.timer.reset().update();
  }

  nextPiece() {
    this.setPiece(this.tetrisRandom.next().value);
    this.nextPieceId = this.tetrisRandom.next().value;
    this.pieceRotation = 0;
    this.pieceX = Math.floor(this.width / 2);
    this.timer.reset().update();
  }

  clearLines() {
    let clearedLines = 0;

    for (let y = 0; y < this.height; y++) {
      const idx = y * this.width;
      const allFull = this.data.slice(idx, idx + this.width).every(i => i !== 0);

      if (!allFull) {
        continue;
      }

      const emptyArray = Array.from({ length: this.width }, () => 0);

      this.data = [].concat(
        emptyArray,
        this.data.slice(0, idx),
        this.data.slice(idx + this.width),
      );

      y = 0;

      clearedLines++;
    }

    if (clearedLines > 0) {
      const level = Math.floor(this.clearedLines / 10);
      this.score += calculateScore(level, clearedLines);
      this.clearedLines += clearedLines;
      this.timer.setInterval(SPEEDS[Math.min(SPEEDS.length - 1, Math.floor(this.clearedLines / 10))]);
    }
  }

  setCell(x, y, value) {
    const index = y * this.width + x;
    this.data[index] = value;
  }

  getCell(x, y) {
    const index = y * this.width + x;
    return this.data[index];
  }

  pieceCollidesAt(x, y, rotation = this.pieceRotation) {
    const tetromino = Tetrominos.get(this.pieceId);
    const data = tetromino.getRotation(rotation % 4);
    const halfSize = tetromino.halfSize;

    for (let ty = 0; ty < tetromino.size; ty++) {
      for (let tx = 0; tx < tetromino.size; tx++) {
        if (!data[ty][tx]) {
          continue;
        }

        const cx = Math.floor(x + tx - halfSize);
        const cy = Math.floor(y + ty - halfSize);

        if (cx < 0) {
          return true;
        }

        if (cx >= this.width) {
          return true;
        }

        if (cy >= this.height) {
          return true;
        }

        if (cy >= 0) {
          const cell = this.getCell(cx, cy);

          if (cell !== 0) {
            return true;
          }
        }
      }
    }

    return false;
  }

  storePiece() {
    const tetromino = Tetrominos.get(this.pieceId);
    const data = tetromino.getRotation(this.pieceRotation);
    const halfSize = tetromino.halfSize;

    const x = this.pieceX;
    const y = this.pieceY;

    for (let ty = 0; ty < tetromino.size; ty++) {
      for (let tx = 0; tx < tetromino.size; tx++) {
        const cx = Math.floor(x + tx - halfSize);
        const cy = Math.floor(y + ty - halfSize);

        if (data[ty][tx]) {
          this.setCell(cx, cy, tetromino.color);
        }
      }
    }

    for (let ty = 0; ty < this.height; ty++) {
      const idx = ty * this.width;
      const chars = this.data.slice(idx, idx + this.width);

      log(chars.map(chr => {
        return chr ? 'X' : '.';
      }).join(''));
    }
  }

  update() {
    if (this.timer.update()) {
      if (!this.moveDown()) {
        this.storePiece();
        this.clearLines();
        this.nextPiece();
      }
    }
  }

  moveDown() {
    if (this.pieceCollidesAt(this.pieceX, this.pieceY + 1)) {
      return false;
    } else {
      this.pieceY++;
      return true;
    }
  }

  draw(display) {
    const halfWidth = this.width / 2;
    const center = Math.ceil(display.cols / 2);
    const left = center - halfWidth * 2;
    const right = center + halfWidth * 2 + 1;

    const top = 2;
    const bottom = top + this.height + 1;

    const shadowedColumns = [];
    const tetromino = Tetrominos.get(this.pieceId);
    const data = tetromino.getRotation(this.pieceRotation);

    for (let x = 0; x < tetromino.size; x++) {
      for (let y = 0; y < tetromino.size; y++) {
        if (data[y][x]) {
          const idx = Math.floor(this.pieceX + x - tetromino.halfSize);
          shadowedColumns.push(idx);
          break;
        }
      }
    }
    log(JSON.stringify({shadowedColumns}))

    drawBackground(display, top, right, bottom, left);
    drawContent(display, this.data, shadowedColumns, this.width, left + 1, 3);
    drawPiece(display, this.pieceId, this.pieceRotation, left + 1, 3, this.pieceX, this.pieceY);
    drawFrame(display, top, right, bottom, left);
  }
}

class GameState {
  constructor() {
    this.keys = '';
    this.grid = new Grid(11, 20);
  }

  start() {
    this.grid.start();
  }

  stop() {
    this.grid.stop();
  }

  withinBounds(engine) {
    if (engine.display.cols <= this.grid.width * 2 + 12) {
      return false;
    }

    if (engine.display.rows <= this.grid.height + 5) {
      return false;
    }

    return true;
  }

  update(engine, keys) {
    if (!this.withinBounds(engine)) {
      return;
    }

    for (let key of keys) {
      switch (key) {
        case Input.KEYS.BACKSPACE:
          this.keys = this.keys.substr(0, this.keys.length - 1);
          break;
        case Input.KEYS.LEFT:
        case Input.KEYS.SHIFT_LEFT:
        case 'j':
        case 'J':
          this.grid.moveLeft();
          break;
        case Input.KEYS.RIGHT:
        case Input.KEYS.SHIFT_RIGHT:
        case 'l':
        case 'L':
          this.grid.moveRight();
          break;
        case ' ':
          this.grid.hardDrop();
          break;
        case Input.KEYS.DOWN:
        case Input.KEYS.SHIFT_DOWN:
          this.grid.moveDown();
          break;
        case 'k':
        case 'z':
        case Input.KEYS.UP:
          this.grid.rotateRight();
          break;
        case 'K':
        case 'Z':
        case Input.KEYS.SHIFT_UP:
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
    if (!this.withinBounds(engine)) {
      display.setCursorPosition(0, 0).printText(`Please resize your screen`);
      return;
    }

    const lines = this.keys.split('\r');

    const now = new Date().getTime();

    const index = this.grid.pieceId;
    const rotation = this.grid.pieceRotation;

    display.hideCursor();

    /*
    display.setCursorPosition(0, 1).printText(`str: ${JSON.stringify(this.keys)}`)
    display.setCursorPosition(0, 2).printText(`index: ${index % Tetrominos.length} rotation: ${rotation % 4}`);
    display.setCursorPosition(0, 3).printText(`X: ${this.grid.pieceX} Y: ${this.grid.pieceY}`);
    */
    display.setCursorPosition(0, 0).printText(`Tetrijs`);
    display.setCursorPosition(0, 2).printText(`Score: ${this.grid.score}`);
    display.setCursorPosition(0, 3).printText(`Level: ${Math.floor(this.grid.clearedLines / 10)} (${(this.grid.clearedLines % 10) * 10}%)`);

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
