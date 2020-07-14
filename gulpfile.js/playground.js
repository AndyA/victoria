"use strict";

require("../lib/use");

const { watch } = require("gulp");
const runCommand = require("tools/run-command");

async function runScript(scriptFile) {
  console.log("Running " + scriptFile);
  await runCommand("node", [scriptFile]);
  console.log("Exited " + scriptFile);
}

async function playground() {
  const w = watch("playground/**/*.js");

  w.on("change", function(path, stats) {
    runScript(path).catch(e => console.error(e));
  });

  w.on("add", function(path, stats) {
    runScript(path).catch(e => console.error(e));
  });
}

module.exports = playground;
