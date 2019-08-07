function log(...args) {
  process.stderr.write(args.map(String).join(' ') + '\n');
}

module.exports = {
  log,
};
