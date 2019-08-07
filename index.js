const Input = require('./input');
const Engine = require('./engine.js');

const { log } = require('./utils');

const Grid = require('./grid');

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
          this.grid.moveDown(true);
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
    display.setCursorPosition(0, 3).printText(`Level: ${this.grid.level} (${(this.grid.clearedLines % 10) * 10}%)`);

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
