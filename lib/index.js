const Input = require('./input');
const Engine = require('./engine.js');

const { log } = require('./utils');

const Grid = require('./grid');

class GameState {
  constructor() {
    this.grid = new Grid(11, 20);
  }

  start() {
    //this.grid.start();
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
          log('SPACE PRESSED', this.grid.gameOver);
          if (this.grid.gameOver) {
            this.grid.start();
          } else {
            this.grid.hardDrop();
          }
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

    display.hideCursor();

    display.setCursorPosition(0, 0).printText(`Tetrijs`);
    display.setCursorPosition(0, 2).printText(`Score: ${this.grid.score}`);
    display
      .setCursorPosition(0, 3)
      .printText(
        `Level: ${this.grid.level} (${(this.grid.clearedLines % 10) * 10}%)`
      );

    this.grid.draw(display);
  }
}

Engine.run(new GameState());
