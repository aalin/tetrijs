class Timer {
  constructor(interval = 1000) {
    this._lastUpdate = null;
    this._interval = interval;
  }

  setInterval(interval) {
    this._interval = interval;
  }

  reset() {
    this._lastUpdate = null;
    return this;
  }

  update() {
    const now = new Date().getTime();

    if (!this._lastUpdate || now - this._lastUpdate > this._interval) {
      this._lastUpdate = now;
      return true;
    }

    return false;
  }
}

module.exports = Timer;
