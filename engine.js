const Display = require('./display');
const Input = require('./input');

function getTimestamp() {
  const hrtime = process.hrtime();
  return hrtime[0] * 1000000 + hrtime[1] / 1000;
}

class Engine {
  static run(state) {
    const engine = new Engine();

    engine.start(state);
  }

  constructor() {
    this.states = [];
    this.keys = [];
    this.input = new Input();
    this.display = new Display();
    this.handleKeyPress = this.handleKeyPress.bind(this);

  }

  start(state) {
    this.running = true;

    this.input.start()
    this.display.start();
    this.keys = [];

    this.input.addListener('keypress', this.handleKeyPress);

    this.states = [state];
    this.states[0].start();

    this._run();
  }

  handleKeyPress(key) {
    if (key === '\u0003') {
      this.stop();
      return;
    }

    if (key === '\f') {
      this.display.forceRedraw();
      return;
    }

    const match = key.match(/^\x1b\[(\d+);(\d+)R$/);

    if (match) {
      this.display.cursorPositionReport(Number(match[1]), Number(match[2]));
    } else {
      this.keys.push(key);
    }

    this.update();
    this.draw();
  }

  _run() {
    if (!this.running) {
      this.stopChildren();
      return;
    }

    this.update();
    this.draw();

    setTimeout(() => this._run(), 50);
  }

  update() {
    this.display.update();

    if (this.states.length) {
      this.states[0].update(this, this.keys);
    }

    this.keys = [];

    this._lastUpdate = new Date();
  }

  draw() {
    this.display.draw();

    if (this.states.length) {
      this.states[0].draw(this, this.display);
    }
  }

  pushState(state) {
    return this.states.unshift(state);
  }

  popState() {
    return this.states.shift();
  }

  stop() {
    this.running = false;
  }

  stopChildren() {
    this.input.removeListener('keypress', this.handleKeyPress);

    let state;
    while (state = this.popState()) {
      state.stop();
    }

    this.display.stop();
    this.input.stop();
  }
}

module.exports = Engine;
