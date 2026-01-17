function timeStringToMs(time) {
  if (!time) return 0;

  const parts = time.split(':').map(Number);
  let hours = 0, minutes = 0, seconds = 0;

  if (parts.length === 3) {
    [hours, minutes, seconds] = parts;
  } else if (parts.length === 2) {
    [minutes, seconds] = parts;
  } else if (parts.length === 1) {
    seconds = parts[0];
  }

  return Math.floor(
    (hours * 3600 + minutes * 60 + seconds) * 1000
  );
}

/* -------------------- TIME UTILS -------------------- */
function toSeconds(t) {
  if (!t) return 0;               // ← FIX
  if (typeof t !== "string") return Number(t) || 0;

  if (t.includes(":")) {
    const p = t.replace(",", ".").split(":").map(Number);
    return p.length === 3
      ? p[0] * 3600 + p[1] * 60 + p[2]
      : p[0] * 60 + p[1];
  }
  return parseFloat(t) || 0;
}

export {timeStringToMs, toSeconds};
