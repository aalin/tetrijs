const Cell = require('./cell');
const ANSI = require('./ansi');

function codePointToChar(codepoint) {
  if (codepoint >= 0 && codepoint < 32) {
    return String.fromCodePoint(0x2400 + codepoint);
  }

  return String.fromCodePoint(codepoint);
}

function changedRanges(buf1, buf2) {
  const width = buf1.length / Cell.SIZE;

  const changedCells = Array.from({ length: width }, (_, i) => {
    const i1 = i * Cell.SIZE;
    const i2 = i * Cell.SIZE + Cell.SIZE;
    const s1 = buf1.slice(i1, i2);
    const s2 = buf2.slice(i1, i2);
    return !s1.equals(s2);
  });

  return createRanges(changedCells);
}

function createRanges(cells) {
  const ranges = [];

  let start = null;
  let end = null;

  for (let i = 0; i <= cells.length; i++) {
    if (cells[i]) {
      if (start === null) {
        start = i;
      }

      end = i + 1;
    }

    if (!cells[i]) {
      if (start !== null) {
        ranges.push([start, end]);
        start = null;
        end = null;
      }
    }
  }

  return ranges;
}

function updateColor(prevFg, prevBg, newFg, newBg, cb) {
  const equalFg = prevFg === newFg;
  const equalBg = prevBg === newBg;

  if (equalFg && equalBg) {
    return;
  }

  if (newFg === 0 && newBg === 0) {
    cb(`\x1b[0m`);
    return;
  }

  let result = [];

  if (!equalFg) { result.push(ANSI.fgColor(newFg)); }
  if (!equalBg) { result.push(ANSI.bgColor(newBg)); }

  cb(`\x1b[${result.join(';')}m`);
  return;
};

class Display {
  constructor() {
    this.buffer = null;
    this.prevBuffer = null;
    this.cursorPositionRequests = [];
    this.handleResize = this.handleResize.bind(this);
    this.x = 0;
    this.y = 0;
  }

  start() {
    console.log('Starting display');
    process.stdout.addListener('resize', this.handleResize);

    this._wasJustResized = false;
    this.handleResize();
    process.stdout.write(ANSI.enableAlternateScreenBuffer());
  }

  stop() {
    process.stdout.write('\x1b[0m');
    process.stdout.removeListener('resize', this.handleResize);
    process.stdout.write(ANSI.disableAlternateScreenBuffer());
    console.log('stopping display');
  }

  requestCursorPosition(cb) {
    this.cursorPositionRequests.push(cb);
    process.stdout.write('\x1b[6n')
  }

  cursorPositionReport(y, x) {
    let cb;

    while (cb = this.cursorPositionRequests.shift()) {
      cb(y, x);
    }
  }

  update() {
    this.handleResize();
  }

  draw() {
    let out = '';

    let changed = false;

    out += ANSI.cursorVisible(false);

    if (this._wasJustResized) {
      changed = true;
      this._wasJustResized = false;
      out += ANSI.eraseInDisplay(2);
      this.setCursorPosition(0, 0);
    }

    let prevBg = null;
    let prevFg = null;

    for (const [y, ranges] of this.changedRows2()) {
      changed = true;

      for (let [start, end] of ranges) {
        for (let x = start; x < end; x++) {
          out += ANSI.cursorPosition(y + 1, x + 1);
          const cell = this.getCell(x, y);

          updateColor(prevFg, prevBg, cell.fg, cell.bg, (str) => {
            out += str;
            prevFg = cell.fg;
            prevBg = cell.bg;
          });

          out += codePointToChar(cell.cp);
        }
      }
    }

    if (changed) {
      this.prevBuffer = this.buffer;
      this.buffer = Cell.createBuffer(this.cols, this.rows);

      out += ANSI.cursorPosition(this.y + 1, this.x + 1);
      out += ANSI.cursorVisible(true);

      process.stdout.write(out);
    }
  }

  *changedRows() {
    const definitelyHasChanged = !this.prevBuffer || this.prevBuffer.length !== this.buffer.length;

    for (let y = 0; y < this.rows; y++) {
      if (definitelyHasChanged) {
        yield y;
        continue;
      }

      const idx = y * this.cols * Cell.SIZE;

      const s1 = this.buffer.slice(idx, idx + this.cols * Cell.SIZE);
      const s2 = this.prevBuffer.slice(idx, idx + this.cols * Cell.SIZE);

      if (!s1.equals(s2)) {
        yield y;
      }
    }
  }

  *changedRows2() {
    const definitelyHasChanged = !this.prevBuffer || this.prevBuffer.length !== this.buffer.length;

    for (let y = 0; y < this.rows; y++) {
      if (definitelyHasChanged) {
        yield [y, [[0, this.cols]]];
        continue;
      }

      const start = y * this.cols * Cell.SIZE;
      const end = (y + 1) * this.cols * Cell.SIZE;

      const s1 = this.buffer.slice(start, end);
      const s2 = this.prevBuffer.slice(start, end);

      if (!s1.equals(s2)) {
        yield [y, changedRanges(s1, s2)];
      }
    }
  }

  setCursorPosition(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  printText(text, attrs = {}) {
    for (let i = 0; i < text.length; i++) {
      this.updateCell(this.x + i, this.y, cell => {
        Object.assign(cell, attrs);
        cell.cp = text.codePointAt(i);
        return cell;
      });
    }

    this.x += text.length;
  }

  getCell(x, y) {
    this.checkBounds(x, y);
    const index = y * this.cols + x;
    return Cell.read(this.buffer, index);
  }

  setCell(x, y, cell) {
  }

  checkBounds(x, y) {
    if (x < 0) {
      throw new Error(`x${x} is < 0`);
    }

    if (y < 0) {
      throw new Error(`y${y} is < 0`);
    }

    if (x >= this.cols) {
      throw new Error(`x${x} is >= ${this.cols}`);
    }

    if (y >= this.rows) {
      throw new Error(`y${y} is >= ${this.rows}`);
    }

    return true;
  }

  updateCell(x, y, callback) {
    const cell = this.getCell(x, y);
    const data = callback(cell) || cell;

    if (data) {
      const index = y * this.cols + x;
      cell.write(this.buffer, index);
    }
  }

  handleResize(e) {
    if (process.stdout.columns === this.cols && process.stdout.rows === this.rows) {
      return;
    }

    console.log('handleResize');
    this.cols = process.stdout.columns;
    this.rows = process.stdout.rows;
    this.buffer = Cell.createBuffer(this.cols, this.rows);
    this.prevBuffer = null;
    this._wasJustResized = true;
  }
}

module.exports = Display;
