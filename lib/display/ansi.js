const palette = require('./palette');

function csi(code) {
  return `\x1b[${code}`;
}

function color(index, offset) {
  if (index < 8) {
    return 30 + offset + index;
  } else if (index < 16) {
    return 90 + offset + index - 8;
  } else {
    return `${38 + offset};5;${index}`;
  }
}

module.exports = {
  csi,
  cursorPosition: (...args) => csi(`${args.join(';')}H`),
  eraseInDisplay: (n) => csi(`${n || ''}J`),
  eraseInLine: (n) => csi(`${n || ''}K`),
  resetColor: () => csi('0m'),
  cursorVisible: (value) => csi(`?25${value ? 'h' : 'l'}`),
  enableAlternateScreenBuffer: () => csi('?1049h'),
  disableAlternateScreenBuffer: () => csi('?1049l'),
  fgColor: (index) => color(index, 0),
  bgColor: (index) => color(index, 10),
  fg16: (r, g, b) => 30 + palette.palette16(r, g, b),
  bg16: (r, g, b) => 40 + palette.palette16(r, g, b),
  fg256: (r, g, b) => `38;5;${palette.palette256(r, g, b)}`,
  bg256: (r, g, b) => `48;5;${palette.palette256(r, g, b)}`,
  fg24bit: (r, g, b) => `38;2;${rgb.join(';')}`,
  bg24bit: (r, g, b) => `48;2;${rgb.join(';')}`,
};
