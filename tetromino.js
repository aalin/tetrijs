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

const ROTATIONS = [
  [ 1.00,  0.00],
  [ 0.00,  1.00],
  [-1.00,  0.00],
  [-0.00, -1.00],
];

const PIECE_COLORS = 'white blue cyan yellow green magenta red'.split(' ');
const ANSI_COLORS = 'black red green yellow blue magenta cyan white'.split(' ');

function rotatePiece(piece, rotation) {
  /*
  const angle = rotation * 90.0;
  const theta = angle / 180.0 * Math.PI;

  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  */
  const [cos, sin] = ROTATIONS[rotation % ROTATIONS.length];

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

class Tetromino {
  constructor(data, color) {
    this.rotations = Array.from({ length: 4 }, (_, j) => rotatePiece(data, j));
    this.color = color;
    this.size = data.length;
    this.halfSize = Math.floor(data.length / 2);
  }

  getRotation(rotation) {
    return this.rotations[rotation % this.rotations.length];
  }
}

const Tetrominoes = Array.from(PIECE_DATA, (data, i) => (
  new Tetromino(data, ANSI_COLORS.indexOf(PIECE_COLORS[i]))
));

// Fisher-Yates shuffle algorithm
// https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array/6274381#6274381
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const x = a[i];
    a[i] = a[j];
    a[j] = x;
  }

  return a;
}

// https://tetris.fandom.com/wiki/SRS
const wallKickDataJLSTZ = [
  [[0, 0],  [-1, 0],  [-1, 1],  [0,-2],  [-1,-2]],
  [[0, 0],  [ 1, 0],  [ 1,-1],  [0, 2],  [ 1, 2]],
  [[0, 0],  [ 1, 0],  [ 1, 1],  [0,-2],  [ 1,-2]],
  [[0, 0],  [-1, 0],  [-1,-1],  [0, 2],  [-1, 2]],
];

const wallKickDataI = [
  [[0, 0], [-1, 0], [-1, 1], [0,-2], [-1,-2]],
  [[0, 0], [ 1, 0], [ 1,-1], [0, 2], [ 1, 2]],
  [[0, 0], [ 1, 0], [ 1, 1], [0,-2], [ 1,-2]],
  [[0, 0], [-1, 0], [-1,-1], [0, 2], [-1, 2]],
];

function getWallKick(data, toRot, fromRot) {
  const reverse = toRot === (fromRot + 1) % data.length;

  if (reverse) {
    return data[(data.length + toRot - 1) % data.length].map(([x, y]) => [-x, -y]);
  } else {
    return data[toRot % data.length].map(([x, y]) => [x, y]);
  }
}

module.exports = {
  length: Tetrominoes.length,

  get(index) {
    return Tetrominoes[index % Tetrominoes.length];
  },

	*randomizer() {
		const indexes = Array.from(Tetrominoes, (_, i) => i);

		let pieces = [];

		while (true) {
			if (pieces.length === 0) {
				pieces = shuffle(Array.from(indexes));
			}

			yield pieces.pop();
		}
	},

  wallKickData(index, toRot, fromRot) {
    switch (index) {
      case 0:
        return getWallKick(wallKickDataI, toRot, fromRot);
      case 3:
        return [[0, 0]];
      default:
        return getWallKick(wallKickDataJLSTZ, toRot, fromRot);
    }
  }
};
