"use strict";

const { spawn } = require("child_process");
const express = require("express");
const app = express();
const _ = require("lodash");
const Promise = require("bluebird");
const config = require("config");
const md5 = require("md5");

const commands = config.commands;

const keyFactory = (size = 8) => {
  const last = {};

  return str => {
    const hash = md5(str).substr(0, size);
    if (last[hash]) return hash + "-" + last[hash]++;
    last[hash] = 1;
    return hash;
  };
};

function cleanOutput(lines) {
  const chunks = lines.reduce((acc, { stream, line }) => {
    const tip = _.last(acc);
    if (tip && tip.stream === stream) tip.lines.push(line);
    else acc.push({ stream, lines: [line] });
    return acc;
  }, []);

  const kf = keyFactory();

  return _.flatMap(chunks, ({ stream, lines }) =>
    lines
      .join("")
      .split("\n")
      .map(line => ({ stream, line, key: kf(line) }))
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

const runner = _.throttle(() => runCommands(commands), 500, {
  trailing: false
});

app.get("/", async (req, res, next) => {
  try {
    res.json(await runner());
  } catch (e) {
    console.error(e);
    next();
  }
});

module.exports = app;
