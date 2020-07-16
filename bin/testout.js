"use strict";

const Promise = require("bluebird");
const fsp = require("fs").promises;

async function dribble(stream, text) {
  while (text.length) {
    const span = Math.ceil(Math.random() * 50);
    const chunk = text.substr(0, span);
    text = text.substr(span);
    stream.write(chunk);
    await Promise.delay(span / 10);
  }
}

(async () => {
  try {
    const text = await fsp.readFile("package.json", "utf8");
    await Promise.all([
      dribble(process.stdout, text),
      dribble(process.stderr, text)
    ]);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
