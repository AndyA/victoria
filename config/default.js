"use strict";

module.exports = {
  app: { port: 31731, root: "www" },
  debug: true,
  commands: [
    ["cat", "/etc/motd"],
    ["uname", "-a"],
    ["git", "remote", "-v"],
    ["uptime"],
    ["lsb_release", "-a"],
    ["tail", "-n", 15, "logs/nginx.access.log"],
    ["pm2", "ps"],
    ["ps", "axuf"]
  ]
};
