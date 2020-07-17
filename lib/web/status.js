"use strict";

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import classnames from "classnames";
import axios from "axios";

function useTimeout(callback, delay, deps = []) {
  useEffect(() => {
    const id = setTimeout(callback, delay);
    return () => clearTimeout(id);
  }, [callback, delay, ...deps]);
}

function useImmediateTimeout(callback, delay, deps = []) {
  useTimeout(callback, delay, deps);
  useEffect(() => {
    callback();
  }, []);
}

function Terminal(props) {
  const { lines, ...rest } = props;
  return (
    <div {...rest}>
      {lines.map(l => (
        <pre key={l.key} className={classnames("line", l.stream)}>
          {l.line}
        </pre>
      ))}
    </div>
  );
}

function Command(props) {
  const { cmd, lines, out, err } = props;
  return (
    <div className="command">
      <pre className="cmd">{cmd.join(" ")}</pre>
      <Terminal className="output" lines={lines} />
    </div>
  );
}

function Status() {
  const [status, setStatus] = useState([]);

  useImmediateTimeout(
    () => axios.get("/data").then(res => setStatus(res.data)),
    500,
    [setStatus]
  );

  return (
    <>
      {status.map(cmd => (
        <Command key={cmd.cmd.join(" ")} {...cmd} />
      ))}
    </>
  );
}

module.exports = Status;
