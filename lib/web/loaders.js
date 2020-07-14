"use strict";

const React = require("react");
const ReactDOM = require("react-dom");
const ReactLoader = require("react/loader");
import { ErrorBoundary } from "react/errors";

const render = (component, elt) =>
  ReactDOM.render(<ErrorBoundary>{component}</ErrorBoundary>, elt);

import Status from "web/status";
ReactLoader.register("status", elt => {
  render(<Status />, elt);
});
