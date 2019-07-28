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
const ANSI_COLORS = 'black red green yellow blue magenta cyan white'.split(' ');

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

const Tetrominoes = Array.from(PIECE_DATA, (data, i) => ({
  rotations: Array.from({ length: 4 }, (_, j) => rotatePiece(data, j)),
  color: ANSI_COLORS.indexOf(PIECE_COLORS[i])
}));

module.exports = Tetrominoes;
