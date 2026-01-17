const itagMap = {
  18: "360p",
  59: "480p",
  22: "720p",
  37: "1080p",
  38: "2160p",
  133: "240p",
  134: "360p",
  135: "480p",
  136: "720p",
  137: "1080p",
  264: "1440p",
  266: "2160p",
  160: "144p",
  298: "720p60",
  299: "1080p60"
};

/**
 * Guess mime type from itag
 */
function detectVideoType(url, itag) {
  const u = url.toLowerCase();

  // HLS (Google Drive mostly uses this)
  if (u.includes(".m3u8") || u.includes("mime=application/x-mpegurl")) {
    return "application/x-mpegURL";
  }

  // WebM
  if (u.includes("mime=video/webm")) {
    return "video/webm";
  }

  // Fallback by itag
  const webmItags = [243, 244, 245, 246, 247, 248, 271, 272];
  if (webmItags.includes(Number(itag))) {
    return "video/webm";
  }

  // Default
  return "video/mp4";
}

export async function getDriveSource(fileId) {
  try {
    const url = `https://corsproxy.io/?https://drive.google.com/get_video_info?docid=${fileId}`;

    const res = await fetch(url, {
      headers: {
        accept: "*/*",
        referer: "https://drive.google.com/"
      }
    });

    const text = await res.text();
    const params = new URLSearchParams(text);

    if (params.get("status") !== "ok") return [];

    // ✅ extract best thumbnail
    const thumb =
      params.get("iurlmaxres") ||
      params.get("iurlhq") ||
      params.get("iurl") ||
      params.get("thumbnail_url") ||
      null;

    const streamMap =
      params.get("fmt_stream_map") ||
      params.get("url_encoded_fmt_stream_map");

    if (!streamMap) return {};

    const streams = streamMap.split(",").map(entry => {
      const [itag, rawUrl] = entry.split("|");
      const src = decodeURIComponent(rawUrl);

      const sourceObj = {
        label: itagMap[itag] || `itag-${itag}`,
        quality: itagMap[itag] || `itag-${itag}`,
        src,
        type: detectVideoType(src, itag)
      };

      // ✅ return as [thumbUrl, sourceObj]
      return {thumb:thumb, source:sourceObj};
    });

    return streams;
  } catch (err) {
    console.error("Drive source error:", err);
    return {};
  }
}
