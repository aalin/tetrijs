const DEFAULT_CELL = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x0, 0x0]);
const CELL_SIZE = DEFAULT_CELL.length;

class Cell {
  constructor({ cp = 0, fg = 0, bg = 0 }) {
    this.cp = cp;
    this.fg = fg;
    this.bg = bg;
  }

  setCp(cp) {
    if (typeof cp === 'number') {
      this.cp = cp;
      return this;
    }

    this.cp = cp.codePointAt(0);
    return this;
  }

  setFg(fg) {
    this.fg = fg;
    return this;
  }

  setBg(bg) {
    this.bg = bg;
    return this;
  }

  static parse(data) {
    return parseCell(data);
  }

  static read(buffer, index) {
    return parseCell(readCell(buffer, index));
  }

  static readRaw(buffer, index) {
    return readCell(buffer, index);
  }

  static write(buffer, index, data) {
    return writeCell(buffer, index, data);
  }

  static createBuffer(cols, rows) {
    return createBuffer(cols, rows);
  }

  write(buffer, index) {
    return writeCell(buffer, index, this);
  }
}

Cell.SIZE = CELL_SIZE;

function readCell(buffer, index) {
  const offset = index * CELL_SIZE;
  return buffer.slice(offset, offset + CELL_SIZE);
}

function parseCell(data) {
  return new Cell({
    cp: data.readUInt32BE(0),
    fg: data.readUInt8(4),
    bg: data.readUInt8(5),
  });
}

function writeCell(buffer, index, data) {
  const offset = index * CELL_SIZE;

  if (data.cp !== undefined) {
    buffer.writeUInt32BE(data.cp, offset);
  }

  if (data.fg !== undefined) {
    buffer.writeUInt8(data.fg, offset + 4);
  }

  if (data.bg !== undefined) {
    buffer.writeUInt8(data.bg, offset + 5);
  }
}

function createBuffer(cols, rows) {
  return Buffer.alloc(cols * rows * CELL_SIZE, DEFAULT_CELL);
}

module.exports = Cell;
