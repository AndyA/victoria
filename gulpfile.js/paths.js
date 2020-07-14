"use strict";

module.exports = {
  app: {
    vix: {
      src: "lib/app/vix.js",
      dest: "www/js"
    }
  },
  scss: {
    src: "lib/app/**/*.{sass,scss}",
    dest: "www/css",
    include: ["lib/sass", "node_modules"],
    watch: ["lib/**/*.{sass,scss}"]
  }
};
