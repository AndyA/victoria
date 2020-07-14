"use strict";

const $ = require("jquery");

$(function() {
  $(".player-box video, .player-embed video").each(function() {
    const $player = $(this);
    const $intro = $(".player-box .intro");

    const videojs = require("video.js");
    const analytics = require("videojs-analytics");
    require("videojs-contrib-hls");

    videojs.plugin("analytics", analytics.default);

    function installAnalytics(player) {
      player.analytics({
        events: [
          { name: "play", label: "video play", action: "play" },
          { name: "pause", label: "video pause", action: "pause" },
          { name: "ended", label: "video ended", action: "ended" },
          {
            name: "fullscreenchange",
            label: {
              open: "video fullscreen open",
              exit: "video fullscreen exit"
            },
            action: "fullscreen change"
          },
          {
            name: "volumechange",
            label: "volume changed",
            action: "volume changed"
          },
          { name: "resize", label: "resize", action: "resize" },
          { name: "error", label: "error", action: "error" },
          { name: "resolutionchange", action: "resolution change" },
          { name: "timeupdate", action: "time updated" }
        ]
      });
    }

    function showIntro() {
      setTimeout(() => $intro.fadeIn(1000), 500);
    }

    const player = videojs($player[0], {
      html5: { hls: { maxMaxBufferLength: 120 }, nativeTextTracks: false }
    });

    // Should be OK in the case that it doesn't start playing at all.
    player.one("playing", function(e) {
      if (player.muted()) showIntro();
    });

    if (player.analytics) installAnalytics(player);

    $intro.on("click", function(e) {
      $(this).fadeOut();
      player.muted(false);
      player.controls(true);
      e.preventDefault();
    });
  });
});
