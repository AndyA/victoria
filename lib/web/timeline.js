"use strict";

import React, { useState, useEffect } from "react";
import { fetchOK, fetchJSON } from "web/fetch";
import classNames from "classnames";
import { EDL } from "cmx3600/edl";
import ProgrammeModel from "arena/programme-model";
import { useVideoJS, useVideoEvent, VideoJS } from "react/videojs";
import _ from "lodash";

// Bootstrap videojs stuff
const videojs = require("video.js");
require("videojs-contrib-hls");

function timeToOffset(d) {
  return (
    d.getHours() * 60 * 60 +
    d.getMinutes() * 60 +
    d.getSeconds() +
    d.getMilliseconds() / 1000
  );
}

const editSig = edits => edits.map(e => e.editSequence).join("-");

function tabulate(obj) {
  return _.flatMap(Object.entries(obj), ([k, v]) => {
    if (_.isArray(v)) return { k, v: v.join(", ") };
    if (_.isObject(v))
      return tabulate(v).map(row => ({ k: k + " " + row.k, v: row.v }));
    return { k, v };
  });
}

function useFetchJSON(url, cooker) {
  const [data, setData] = useState(null);
  cooker = cooker || (x => x);

  useEffect(() => {
    let waiting = true;
    (async () => {
      const newData = await fetchJSON(url);
      if (waiting) setData(cooker(newData));
    })();
    return () => (waiting = false);
  }, []);

  return [data, setData];
}

function useEdits(initEdits) {
  const [edits, set] = useState(initEdits || []);

  const setEdits = newEdits =>
    editSig(newEdits) === editSig(edits) || set(newEdits);

  return [edits, setEdits];
}

function DataTable(props) {
  const { table } = props;
  return (
    <table>
      <thead>
        <tr>
          <th>key</th>
          <th>value</th>
        </tr>
      </thead>
      <tbody>
        {table.map(row => (
          <tr key={row.k}>
            <td>{row.k}</td>
            <td>{row.v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Edit(props) {
  const { edit, model, currentTime } = props;
  const prog = model.find(edit.reelNum);
  const table = tabulate(
    _.omit(edit, "inTC", "outTC", "idx", "inTime", "outTime")
  );

  const inTime = edit.inTime % (24 * 3600 * 1000);
  const duration = edit.outTime - edit.inTime;
  const width =
    Math.max(0, Math.min(1, (currentTime - inTime) / duration)) * 100;

  if (prog)
    table.unshift(
      { k: "title", v: prog.programmeTitle },
      { k: "date", v: prog.date }
    );

  return (
    <div className="edit">
      <div className="progress" style={{ width: `${width}%` }} />
      <DataTable table={table} />
    </div>
  );
}

function Edits(props) {
  const { edits, ...rest } = props;
  return (
    <div className="edits">
      {edits.map(edit => (
        <Edit key={edit.editSequence} edit={edit} {...rest} />
      ))}
    </div>
  );
}

function Timeline(props) {
  const { context } = props;
  const { player, timeline } = context;
  const [edits, setEdits] = useEdits();
  const [currentTime, setCurrentTime] = useState();

  const [edl, setEDL] = useFetchJSON(
    "/data/edl",
    data => new EDL(data, { rate: player.rate })
  );

  const [model, setModel] = useFetchJSON(
    "/data/model",
    data => new ProgrammeModel(data)
  );

  const [vjs, videoRef] = useVideoJS({
    sources: [{ src: player.vodSrc, type: player.type }],
    html5: { hls: { maxMaxBufferLength: 120 }, nativeTextTracks: false },
    width: player.width,
    height: player.height,
    controls: true,
    autoplay: true,
    muted: true,
    loop: true
  });

  useEffect(() => {
    if (!vjs) return;
    const offset = timeToOffset(new Date());
    vjs.currentTime(offset);
  }, [vjs]);

  useVideoEvent(
    vjs,
    "timeupdate",
    () => {
      const ct = vjs.currentTime() * 1000;
      setCurrentTime(ct);
      edl && setEdits(edl.findAt(ct));
    },
    [edl, setEdits]
  );

  return (
    <div className="timeline">
      <VideoJS
        videoRef={videoRef}
        width={player.width}
        height={player.height}
      />
      <Edits edits={edits} currentTime={currentTime} model={model} />
    </div>
  );
}

export { Timeline };
