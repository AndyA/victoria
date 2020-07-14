"use strict";

import fetch from "cross-fetch";

async function fetchOK(...args) {
  const res = await fetch(...args);
  if (res.status !== 200)
    throw new Error("Error loading data from server (" + res.status + ")");
  return res;
}

async function fetchJSON(...args) {
  const res = await fetchOK(...args);
  const data = await res.json();
  return data;
}

export { fetchOK, fetchJSON };
