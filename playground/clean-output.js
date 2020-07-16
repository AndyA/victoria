"use strict";

const { spawn } = require("child_process");
const _ = require("lodash");
const Promise = require("bluebird");

function cleanOutput(lines) {
  const chunks = lines.reduce((acc, { stream, line }) => {
    const tip = _.last(acc);
    if (tip && tip.stream === stream) tip.lines.push(line);
    else acc.push({ stream, lines: [line] });
    return acc;
  }, []);

  return _.flatMap(chunks, ({ stream, lines }) =>
    lines
      .join("")
      .split("\n")
      .map(line => ({ stream, line }))
  );
}

async function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const out = [];
    const err = [];
    const lines = [];
    const payload = () => ({ lines: cleanOutput(lines) });
    const p = spawn(cmd, args)
      .on("close", () => resolve(payload()))
      .on("error", () => reject(payload()));

    for (const stream of ["stdout", "stderr"])
      p[stream].on("data", data =>
        lines.push({ stream, line: data.toString("utf8") })
      );
  });
}

async function runCommands(cmds) {
  return await Promise.map(cmds, async cmd => {
    const [c, ...args] = cmd;
    const res = await runCommand(c, args);
    return { cmd, ...res };
  });
}

(async () => {
  try {
    const lines = await runCommand("node", ["bin/testout.js"]);
    for (const line of lines.lines) console.log(line);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
