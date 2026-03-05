export class RvXDrivePlayer {

static async attach(video, url, options={}) {

    const chunkSize = options.chunkSize || 1024*1024*2; // 2MB
    const bufferAhead = options.bufferAhead || 20; // seconds

    const mediaSource = new MediaSource();
    video.src = URL.createObjectURL(mediaSource);

    let fileSize = 0;
    let mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

    // --- get file size ---
    const head = await fetch(url, {method:'HEAD'});
    fileSize = Number(head.headers.get('content-length'));

    mediaSource.addEventListener('sourceopen', async ()=>{

        const sb = mediaSource.addSourceBuffer(mime);

        let nextByte = 0;
        let fetching = false;

        async function fetchChunk(start) {
            if(fetching) return;
            if(start >= fileSize) return;

            fetching = true;

            const end = Math.min(start + chunkSize - 1, fileSize-1);

            const res = await fetch(url, {
                headers:{ "Range":`bytes=${start}-${end}` }
            });

            const data = await res.arrayBuffer();

            await new Promise(r=>{
                sb.addEventListener("updateend", r, {once:true});
                sb.appendBuffer(data);
            });

            nextByte = end+1;
            fetching = false;
        }

        // initial buffer
        await fetchChunk(0);
        await fetchChunk(nextByte);

        // --- buffer loop ---
        setInterval(()=>{
            if(!video.duration || video.readyState<2) return;

            const buffered = video.buffered.length ?
                video.buffered.end(video.buffered.length-1) : 0;

            if(buffered - video.currentTime < bufferAhead){
                fetchChunk(nextByte);
            }

        },500);

        // --- seeking ---
        video.addEventListener("seeking", ()=>{
            const byte = Math.floor(fileSize*(video.currentTime/video.duration));
            nextByte = byte - (byte%chunkSize);
            fetchChunk(nextByte);
        });

    });
}
}

window.RvXDrivePlayer = RvXDrivePlayer;
