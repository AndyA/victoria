"use strict";

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
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

function Output(props) {
  const { lines, ...rest } = props;
  return (
    <div {...rest}>
      {lines.map((l, key) => (
        <pre className="line" key={key}>
          {l}
        </pre>
      ))}
    </div>
  );
}

function Command(props) {
  const { cmd, out, err } = props;
  return (
    <div className="command">
      <div className="cmd">{cmd.join(" ")}</div>
      <Output className="out output" lines={out} />
      <Output className="err output" lines={err} />
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
