const PIECE_DATA = [
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ], [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ], [
    [1, 1],
    [1, 1],
  ], [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ], [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ], [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
];

const PIECE_COLORS = 'white blue cyan yellow green magenta red'.split(' ');

function rotatePiece(piece, rotation) {
  const angle = rotation * 90.0;
  const theta = angle / 180.0 * Math.PI;

  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  const center = (piece.length - 1) / 2;

  return Array.from({ length: piece.length }, (_, x) => (
    Array.from({ length: piece.length }, (_, y) => {
      const x2 = x - center;
      const y2 = y - center;

      const x3 = (Math.round(x2 * sin + y2 * cos + center)) % piece.length;
      const y3 = (Math.round(x2 * cos - y2 * sin + center)) % piece.length;

      return piece[y3][x3];
    })
  ));
}

const ANSI_COLORS = 'black red green yellow blue magenta cyan white'.split(' ');

function drawPiece(px, py, data, color) {
  const colorIndex = ANSI_COLORS.indexOf(color);
  let text = '\x1b[41m';
  const colorCode = `\x1b[${40 + colorIndex}m`;
  const bgColor = `\x1b[48;5;234m`;

  let colorOn = false;

  for (let y = 0; y < data.length; y++) {
    text += `\x1b[${py + y + 1};${px * 2 + 1}H`;

    text += bgColor;

    for (let x = 0; x < data.length; x++) {
      if (data[y][x]) {
        if (!colorOn) {
          colorOn = true;
          text += colorCode;
        }
      } else if (colorOn) {
        text += bgColor;
        colorOn = false;
      }

      text += '  ';
    }

    text += '\x1b[0m';
    colorOn = false;
    text += '\n';
  }

  text += '\x1b[0m';

  console.log(text);
}

/*
let y = 0;

for (let index = 0; index < PIECE_DATA.length; index++) {
  const data = PIECE_DATA[index];
  const color = PIECE_COLORS[index];

  for (let r = 0; r < 4; r++) {
    const x = r * (data.length + 1);
    const rotated = rotatePiece(data, r);
    //drawPiece(x, y, rotated, color);
  }

  y += data.length + 1;
}
*/

const Tetrominoes = Array.from(PIECE_DATA, (data, i) => ({
  rotations: Array.from({ length: 4 }, (_, j) => rotatePiece(data, j)),
  color: ANSI_COLORS.indexOf(PIECE_COLORS[i])
}));

module.exports = Tetrominoes;
