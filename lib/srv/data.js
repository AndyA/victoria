"use strict";

const { spawn } = require("child_process");
const express = require("express");
const app = express();
const _ = require("lodash");
const Promise = require("bluebird");

const getStash = (...extra) =>
  _.mergeWith({}, { ...config }, ...extra, (obj, src) => {
    if (typeof src === "function") return src(obj);
  });

const cleanLines = (v) =>
  _.dropRightWhile(v.join("").split("\n"), (l) => !l.length);

async function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const out = [];
    const err = [];
    const payload = () => _.mapValues({ out, err }, cleanLines);
    const p = spawn(cmd, args)
      .on("close", () => resolve(payload()))
      .on("error", () => reject(payload()));
    p.stdout.on("data", (data) => out.push(data.toString("utf8")));
    p.stderr.on("data", (data) => err.push(data.toString("utf8")));
  });
}

async function runCommands(cmds) {
  return await Promise.map(cmds, async (cmd) => {
    const [c, ...args] = cmd;
    const res = await runCommand(c, args);
    return { cmd, ...res };
  });
}

const commands = [
  ["uname", "-a"],
  ["uptime"],
  ["date"],
  ["ps", "ax"],
  ["lsb_release", "-a"],
];

const runner = _.throttle(() => runCommands(commands), 500, {
  trailing: false,
});

app.get("/", async (req, res, next) => {
  try {
    //    const info = await runCommands(commands);
    const info = await runner();
    res.json(info);
  } catch (e) {
    console.error(e);
    next();
  }
});

module.exports = app;
