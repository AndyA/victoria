"use strict";

const React = require("react");
const ReactDOM = require("react-dom");
const ReactLoader = require("./react-loader");
import { ErrorBoundary } from "react/errors";

const render = (component, elt) =>
  ReactDOM.render(<ErrorBoundary>{component}</ErrorBoundary>, elt);

//const { Timeline } = require("web/timeline");
//ReactLoader.register("timeline", elt => {
//  const context = JSON.parse(elt.getAttribute("data-context"));
//  render(<Timeline context={context} />, elt);
//});
