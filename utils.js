function log(...args) {
  process.stderr.write(`${new Date().toISOString()}: ` + args.map(String).join(' ') + '\n');
}

module.exports = {
  log,
};
