"use strict";

const express = require("express");
const app = express();
const _ = require("lodash");

const getStash = (...extra) =>
  _.mergeWith({}, { ...config }, ...extra, (obj, src) => {
    if (typeof src === "function") return src(obj);
  });

app.get("/", (req, res) => {
  res.render("home", getStash());
});

module.exports = app;
