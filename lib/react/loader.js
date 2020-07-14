"use strict";

const ANIMATION = "reactAppRootReady";
const ATTR_LOADER_AWARE = "data-react-loader-aware";
const ATTR_REACT_APP = "data-react-app";

class ReactLoader {
  static _launchPending(appName) {
    const init = this.apps[appName];
    if (!init) return;

    const ready = this.ready[appName] || [];
    delete this.ready[appName];

    for (const elt of ready) init(elt);
  }

  static _launchAllPending() {
    for (const appName of Object.keys(this.ready)) this._launchPending(appName);
  }

  static _ready(appName, target) {
    target.setAttribute(ATTR_LOADER_AWARE, true);
    (this.ready[appName] = this.ready[appName] || []).push(target);
  }

  static _findPending() {
    const roots = document.querySelectorAll("[" + ATTR_REACT_APP + "]");
    for (const root of roots) {
      if (root.hasAttribute(ATTR_LOADER_AWARE)) continue;
      const appName = root.getAttribute(ATTR_REACT_APP);
      this._ready(appName, root);
    }
  }

  static _unhook() {
    document.removeEventListener(
      "animationstart",
      this.rl.animationStartedHandler
    );
    window.removeEventListener("DOMContentLoaded", this.rl.domLoadedHandler);
  }

  static _domLoaded() {
    // Remove our event listeners
    this._unhook();
    // Find unmounted app roots
    this._findPending();
    // Launch remaining app
    this._launchAllPending();
  }

  static _animationEvent(ev) {
    if (ev.animationName !== ANIMATION) return;
    const target = ev.target;
    const appName = target.getAttribute(ATTR_REACT_APP);
    this._ready(appName, ev.target);
    this._launchPending(appName);
  }

  static _bootstrap(rl) {
    this.rl = rl;
    this.ready = {};
    this.apps = {};

    this.rl.animationStarted = this._animationEvent.bind(this);
    this.rl.domLoaded = this._domLoaded.bind(this);

    for (const ev of rl.queue) this._animationEvent(ev);

    if (this.rl.loaded) this._domLoaded();
  }

  static register(appName, init) {
    if (this.apps[appName]) throw new Error(appName + " already registered");
    this.apps[appName] = init;
    this._launchPending(appName);
    return this;
  }
}

ReactLoader._bootstrap(REACT_LOADER);

module.exports = ReactLoader;
