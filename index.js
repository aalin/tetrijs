const Engine = require('./engine.js');
const Tetrominoes = require('./tetromino');

function drawPiece(display, index, rotation, xPos, yPos) {
  const tetromino = Tetrominoes[index % Tetrominoes.length];
  const data = tetromino.rotations[rotation % tetromino.rotations.length];

  for (let y = 0; y < data.length; y++) {
    for (let x = 0; x < data.length; x++) {
      display.setCursorPosition(xPos + x * 2, yPos + y);

      if (data[y][x]) {
        display.printText("XX", { bg: tetromino.color })
      } else {
        display.printText("  ")
      }
    }
  }
}

class GameState {
  constructor() {
    this.keys = '';
  }

  start() {
  }

  stop() {
  }

  update(engine, keys) {
    for (let key of keys) {
      if (key === '\x7f') {
        this.keys = this.keys.substr(0, this.keys.length - 1);
      } else {
        this.keys += key;
      }
    }
  }

  draw(engine, display) {
    const lines = this.keys.split('\r');

    const now = new Date().getTime();
    const index = Math.floor(Math.floor(now / 4000));

    const rotation = Math.floor(Math.floor(now / 1000));

    drawPiece(display, index, rotation, 0, 5);
    drawPiece(display, index + 1, rotation, 10, 5);
    drawPiece(display, index + 2, rotation, 20, 5);
    drawPiece(display, index + 3, rotation, 0, 15);
    drawPiece(display, index + 4, rotation, 10, 15);
    drawPiece(display, index + 5, rotation, 20, 15);

    display.setCursorPosition(0, 2).printText(`index: ${index % Tetrominoes.length} rotation: ${rotation % 4}   `);

    display.setCursorPosition(0, 0)
    /*
    for (let i = 0; i < lines.length; i++) {
      display
        .setCursorPosition(5, 5 + i)
        .printText(lines[i])
    }
    */
  }
}

Engine.run(new GameState());
