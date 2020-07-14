"use strict";

require("../lib/use.js");

const config = require("config");
const express = require("express");

const app = express();

//app.use(require("srv/views.js"));

app.use(express.static(config.get("app.root")));

app.listen(config.get("app.port"));
