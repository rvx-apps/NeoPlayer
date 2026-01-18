function detectVideoType(url) {
  const u = url.toLowerCase();

  if (u.includes(".m3u8")) return "application/x-mpegURL";
  if (u.includes(".webm")) return "video/webm";
  return "video/mp4";
}

function normalizeFBVideoData(data) {
  if (!data || !data.success || !data.videos) {
    return { thumb: null, source: [] };
  }

  const sources = Object.entries(data.videos).map(([quality, info]) => {
    return {
      label: quality.toUpperCase(),     // hd → HD, sd → SD
      src: info.url,
      type: detectVideoType(info.url),
      size: info.size || null
    };
  });

  return {
    thumb: data.thumbnail || null, // FB APIs usually don't return thumb
    source: sources
  };
}


export async function getFbSource(url) {
  try {
    const url = `https://fbex-ten.vercel.app/api/fb2?url=${url}`;

    const res = await fetch(url, {
      headers: {
        accept: "*/*"
      }
    });

    const j = await res.json();
    if(j.success){
      return normalizeFBVideoData(j);
    }else{
      return {};
    }
  }catch (e){
    console.log(e);
    return {}
  }
}
