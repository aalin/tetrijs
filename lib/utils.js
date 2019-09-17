const RANDOM_NUMBERS = Array.from({ length: 256 }, Math.random);

function lerp(v0, v1, t) {
  return v0 * (1 - t) + v1 * t;
}

function getRandomNumber(index) {
  return RANDOM_NUMBERS[mod(index, RANDOM_NUMBERS.length)];
}

function mod(x, n) {
  const add = x < 0 ? n * Math.ceil(Math.abs(x) / n) : 0;
  return (x + add) % n;
}

function noop() {}

function log(...args) {
  process.stderr.write(`${new Date().toISOString()}: ` + args.map(String).join(' ') + '\n');
}

module.exports = {
  log: process.env.DEBUG ? log : noop,
  getRandomNumber,
  lerp,
};
