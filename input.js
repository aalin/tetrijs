const EventEmitter = require('events').EventEmitter;

class Input extends EventEmitter {
  constructor(stdin = process.stdin) {
    super();
    this.stdin = stdin;
    this._onData = this._onData.bind(this);
  }

  start() {
    console.log('starting input');
    this.stdin.setRawMode(true);
    this.stdin.resume();
    this.stdin.setEncoding('utf8');
    this.stdin.addListener('data', this._onData);
  }

  stop() {
    console.log('stopping input');
    this.removeAllListeners();
    this.stdin.removeListener('data', this._onData);
    this.stdin.removeAllListeners('data');
    this.stdin.setRawMode(false);
    this.stdin.pause();
  }

  _onData(key) {
    this.emit('keypress', key);
  }
}

Input.KEYS = {
  ETX: "\u0003",
  UP: "\u001b[A",
  DOWN: "\u001b[B",
  RIGHT: "\u001b[C",
  LEFT: "\u001b[D",
};

module.exports = Input;
