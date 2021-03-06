const { log } = require('./utils');
const EventEmitter = require('events').EventEmitter;

class Input extends EventEmitter {
  constructor(stdin = process.stdin) {
    super();
    this.stdin = stdin;
    this._onData = this._onData.bind(this);
  }

  start() {
    log('Starting input');
    this.stdin.setRawMode(true);
    this.stdin.resume();
    this.stdin.setEncoding('utf8');
    this.stdin.addListener('data', this._onData);
  }

  stop() {
    log('Stopping input');
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
  ETX: '\u0003',
  BACKSPACE: '\x7f',
  UP: '\u001b[A',
  DOWN: '\u001b[B',
  RIGHT: '\u001b[C',
  LEFT: '\u001b[D',
  SHIFT_UP: '\u001b[1;2A',
  SHIFT_DOWN: '\u001b[1;2B',
  SHIFT_RIGHT: '\u001b[1;2C',
  SHIFT_LEFT: '\u001b[1;2D',
};

module.exports = Input;
