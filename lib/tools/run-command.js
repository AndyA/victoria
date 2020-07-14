"use strict";

const { spawn } = require("child_process");
const Promise = require("bluebird");

async function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit" })
      .on("close", resolve)
      .on("error", reject);
  });
}

module.exports = runCommand;
