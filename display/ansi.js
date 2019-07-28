function csi(code) {
  return `\x1b[${code}`;
}

module.exports = {
  csi,
  cursorPosition: (...args) => csi(`${args.join(';')}H`),
  eraseInDisplay: (n) => csi(`${n || ''}J`),
  eraseInLine: (n) => csi(`${n || ''}K`),
  resetColor: () => csi('0m'),
  cursorVisible: (value) => csi(`?25${ value ? 'h' : 'l' }`),
  enableAlternateScreenBuffer: () => csi('?1049h'),
  disableAlternateScreenBuffer: () => csi('?1049l'),
  fgColor: (index) => {
    if (index < 8) {
      return 30 + index;
    } else if (index < 16) {
      return 90 + index;
    } else {
      return `38;5;${index}`;
    }
  },
  bgColor: (index) => {
    if (index < 8) {
      return 40 + index;
    } else if (index < 16) {
      return 100 + index;
    } else {
      return `48;5;${index}`;
    }
  },
};
