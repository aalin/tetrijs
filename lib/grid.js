const { log } = require('./utils');
const Timer = require('./timer');
const graphics = require('./graphics');
const Tetrominos = require('./tetromino');

const SPEEDS = [
  800,
  720,
  630,
  550,
  470,
  380,
  300,
  220,
  130,
  100,
  80,
  80,
  80,
  70,
  70,
  70,
  50,
];
const SCORES = [40, 100, 300, 1200];

function calculateScore(level, lineCount) {
  return SCORES[Math.min(lineCount, SCORES.length - 1)] * (level + 1);
}

function createGrid(width, height) {
  return Array.from({ length: width * height }, (_, i) => {
    const y = Math.floor(i / width);
    const x = i % width;

    if (y > height - 5) {
      if (x !== 2) {
        return 1;
      }
    }

    return 0;
  });
}

class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.data = createGrid(this.width, this.height);

    this.gameOver = true;

    this.tetrisRandom = null;
    this.score = 0;
    this.clearedLines = 0;

    this.timer = new Timer(800);

    this.pieceX = Math.floor(width / 2);
    this.pieceY = 0;

    this.pieceRotation = 0;
    this.pieceId = 0;
    this.nextPieceId = null;
  }

  get level() {
    return Math.floor(this.clearedLines / 10);
  }

  start() {
    this.data = createGrid(this.width, this.height);
    this.gameOver = false;
    this.clearedLines = 0;

    this.timer.setInterval(SPEEDS[Math.min(SPEEDS.length - 1, this.level)]);

    this.score = 0;

    this.tetrisRandom = Tetrominos.randomizer();
    this.nextPieceId = null;
    this.nextPiece();
  }

  stop() {}

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

    const kicks = Tetrominos.wallKickData(
      this.pieceId,
      nextRotation,
      this.pieceRotation
    );

    log('Rotate', direction, JSON.stringify(kicks));

    for (let [x, y] of kicks) {
      if (
        !this.pieceCollidesAt(this.pieceX + x, this.pieceY - y, nextRotation)
      ) {
        this.pieceRotation = nextRotation;
        this.pieceX += x;
        this.pieceY -= y;
        return;
      }
    }
  }

  setPiece(id) {
    this.pieceId = id;
    log('setPiece', id);
    this.pieceY = 0;
    this.pieceX = Math.floor(this.width / 2);

    if (this.pieceCollidesAt(this.pieceX, this.pieceY, this.pieceRotation)) {
      this.gameOver = true;

      if (this.parent) {
        this.parent.gameOver(this);
      }
    }
  }

  nextPiece() {
    this.setPiece(
      this.nextPieceId === null
        ? this.tetrisRandom.next().value
        : this.nextPieceId
    );
    this.nextPieceId = this.tetrisRandom.next().value;
    this.pieceRotation = 0;
  }

  clearLines() {
    let clearedLines = 0;

    for (let y = 0; y < this.height; y++) {
      const idx = y * this.width;
      const allFull = this.data
        .slice(idx, idx + this.width)
        .every((i) => i !== 0);

      if (!allFull) {
        continue;
      }

      const emptyArray = Array.from({ length: this.width }, () => 0);

      this.data = [].concat(
        emptyArray,
        this.data.slice(0, idx),
        this.data.slice(idx + this.width)
      );

      y = 0;

      clearedLines++;
    }

    if (clearedLines > 0) {
      const level = Math.floor(this.clearedLines / 10);
      this.score += calculateScore(level, clearedLines);
      this.clearedLines += clearedLines;
      this.timer.setInterval(
        SPEEDS[Math.min(SPEEDS.length - 1, Math.floor(this.clearedLines / 10))]
      );
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

        const cx = x + tx - halfSize;
        const cy = y + ty - halfSize;

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
    log('storePiece');
    const tetromino = Tetrominos.get(this.pieceId);
    const data = tetromino.getRotation(this.pieceRotation);
    const halfSize = tetromino.halfSize;

    const x = this.pieceX;
    const y = this.pieceY;

    for (let ty = 0; ty < tetromino.size; ty++) {
      for (let tx = 0; tx < tetromino.size; tx++) {
        const cx = x + tx - halfSize;
        const cy = y + ty - halfSize;

        if (data[ty][tx]) {
          this.setCell(cx, cy, tetromino.color);
        }
      }
    }
  }

  update() {
    if (this.gameOver) {
      return;
    }

    if (this.timer.update()) {
      if (!this.moveDown()) {
        this.storePiece();
        this.clearLines();
        this.nextPiece();
      }
    }
  }

  moveDown(resetTimer = false) {
    if (this.pieceCollidesAt(this.pieceX, this.pieceY + 1)) {
      return false;
    } else {
      this.pieceY++;

      if (resetTimer) {
        this.timer.reset().update();
      }

      return true;
    }
  }

  getGhostPosition() {
    for (let y = this.pieceY + 1; y < this.pieceY + 20; y++) {
      if (this.pieceCollidesAt(this.pieceX, y)) {
        return y - 1;
      }
    }

    return -1;
  }

  draw(display) {
    if (this.gameOver) {
      graphics.drawGameOverScreen(display);
      return;
    }

    const halfWidth = this.width / 2;
    const center = Math.ceil(display.cols / 2);
    const left = center - halfWidth * 2;
    const right = center + halfWidth * 2 + 1;

    const height = this.height + 6;

    const top = Math.floor(display.rows / 2 - height / 2) + 2;
    const bottom = top + this.height + 1;

    const shadowedCells = [];
    const tetromino = Tetrominos.get(this.pieceId);
    const data = tetromino.getRotation(this.pieceRotation);

    const ghostPositionY = this.getGhostPosition();

    const tdiv = 8000;
    const pscale = 1.0;

    graphics.drawBackground(display, top, right, bottom, left, tdiv, pscale);
    graphics.drawContent(display, this.data, [], this.width, left, top);

    if (ghostPositionY >= 0) {
      graphics.drawGhostPiece(
        display,
        this.pieceId,
        this.pieceRotation,
        left,
        top,
        this.pieceX,
        ghostPositionY
      );
    }

    graphics.drawPiece(
      display,
      this.pieceId,
      this.pieceRotation,
      left,
      top,
      this.pieceX,
      this.pieceY
    );

    graphics.drawFrame(display, top, right, bottom, left, tdiv, pscale);

    display.setCursorPosition(0, 5).printText(`Next piece:`);

    if (this.nextPieceId !== null) {
      graphics.drawPiece(display, this.pieceId, 0, 3, 7, 0, 0);
    }
  }
}

module.exports = Grid;
