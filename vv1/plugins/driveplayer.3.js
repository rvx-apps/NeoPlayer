export class RvXDrivePlayer {

static async attach(video, url, options = {}) {

    console.log("[RvXDrivePlayer] Attaching player...");
    console.log("[RvXDrivePlayer] URL:", `${url}`);
    console.log(JSON.stringify(url));
    console.log("[RvXDrivePlayer] Options:", `${options}`);
    console.log(JSON.stringify(options));

    const player = {};
    player.onerror = null;
    player.onready = null;
    player.onattach = null;
    player.onchunk = null;

    const chunkSize = options.chunkSize || 1024 * 1024 * 2;
    const bufferAhead = options.bufferAhead || 20;

    const mediaSource = new MediaSource();
    video.src = URL.createObjectURL(mediaSource);

    let fileSize = 0;
    let mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

    try {

        console.log("[RvXDrivePlayer] Getting file info...");

        const head = await fetch(url, { method: "HEAD" });

        fileSize = Number(head.headers.get("content-length"));

        console.log("[RvXDrivePlayer] File size:", fileSize);

        if (player.onattach) player.onattach({
            url,
            fileSize,
            chunkSize,
            bufferAhead
        });

    } catch (e) {

        console.error("[RvXDrivePlayer] Attach failed:", e);

        if (player.onerror) player.onerror(e);
        return player;
    }

    mediaSource.addEventListener("sourceopen", async () => {

        console.log("[RvXDrivePlayer] MediaSource opened");

        const sb = mediaSource.addSourceBuffer(mime);

        let nextByte = 0;
        let fetching = false;

        async function fetchChunk(start) {

            if (fetching) return;
            if (start >= fileSize) return;

            fetching = true;

            const end = Math.min(start + chunkSize - 1, fileSize - 1);

            console.log("[RvXDrivePlayer] Fetch chunk:", start, "-", end);

            try {

                const res = await fetch(url, {
                    headers: {
                        "Range": `bytes=${start}-${end}`
                    }
                });

                const data = await res.arrayBuffer();

                await new Promise(r => {
                    sb.addEventListener("updateend", r, { once: true });
                    sb.appendBuffer(data);
                });

                nextByte = end + 1;

                if (player.onchunk) player.onchunk({
                    start,
                    end,
                    nextByte
                });

            } catch (e) {

                console.error("[RvXDrivePlayer] Chunk error:", `${e}`);

                if (player.onerror) player.onerror(e);
            }

            fetching = false;
        }

        console.log("[RvXDrivePlayer] Initial buffering...");

        await fetchChunk(0);
        await fetchChunk(nextByte);

        console.log("[RvXDrivePlayer] Player ready");

        if (player.onready) player.onready();

        setInterval(() => {

            if (!video.duration || video.readyState < 2) return;

            const buffered = video.buffered.length
                ? video.buffered.end(video.buffered.length - 1)
                : 0;

            if (buffered - video.currentTime < bufferAhead) {
                fetchChunk(nextByte);
            }

        }, 500);

        video.addEventListener("seeking", () => {

            console.log("[RvXDrivePlayer] Seeking:", video.currentTime);

            const byte = Math.floor(fileSize * (video.currentTime / video.duration));
            nextByte = byte - (byte % chunkSize);

            fetchChunk(nextByte);
        });

    });

    return player;
}
}
window.RvXDrivePlayer = RvXDrivePlayer;
