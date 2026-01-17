/* -------------------- SRT / VTT -------------------- */
function parseSRT(data) {
  return data.trim().split(/\n\n+/).map(b => {
    const l = b.split("\n");
    const [s, e] = l[1].split(" --> ");
    
    return {
      start: toSeconds(s),
      end: toSeconds(e),
      text: l.slice(2).join("\n")
    };
    
  });
}

function parseVTT(data) {
  return parseSRT(data.replace("WEBVTT", ""));
}

/*-------- parse both ----------*/

function parseSub(data) {
  data = data.replace(/\r/g, "");

  // remove WEBVTT header
  data = data.replace(/^WEBVTT.*\n/, "");

  const blocks = data.split(/\n\n+/);
  const cues = [];

  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim());
    if (!lines.length) continue;

    // find the timing line
    const timeLine = lines.find(l => l.includes("-->"));
    if (!timeLine) continue;

    // extract ONLY times (ignore cue settings)
    const [startRaw, rest] = timeLine.split("-->");
    const endRaw = rest.trim().split(/\s+/)[0];

    const start = toSeconds(startRaw.trim());
    const end = toSeconds(endRaw.trim());

    if (!start && !end) continue; // skip junk blocks

    const textStart = lines.indexOf(timeLine) + 1;
    const text = lines.slice(textStart).join("\n");

    cues.push({ start, end, text });
  }

  return cues;
}
export {parseSRT,parseVTT,parseSub};
