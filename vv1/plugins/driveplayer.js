export class RvXDrivePlayer {

static async attach(video, url, options={}) {

    const player = {}; // returned object
    player.onerror = null;

    const chunkSize = options.chunkSize || 1024*1024*2;
    const bufferAhead = options.bufferAhead || 20;

    const mediaSource = new MediaSource();
    video.src = URL.createObjectURL(mediaSource);

    let fileSize = 0;
    let mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

    try {

        const head = await fetch(url,{method:'HEAD'});
        fileSize = Number(head.headers.get('content-length'));

    } catch(e) {
        if(player.onerror) player.onerror(e);
        return player;
    }

    mediaSource.addEventListener('sourceopen', async ()=>{

        const sb = mediaSource.addSourceBuffer(mime);

        let nextByte = 0;
        let fetching = false;

        async function fetchChunk(start){

            if(fetching) return;
            if(start >= fileSize) return;

            fetching = true;

            try {

                const end = Math.min(start+chunkSize-1,fileSize-1);

                const res = await fetch(url,{
                    headers:{ "Range":`bytes=${start}-${end}` }
                });

                const data = await res.arrayBuffer();

                await new Promise(r=>{
                    sb.addEventListener("updateend",r,{once:true});
                    sb.appendBuffer(data);
                });

                nextByte = end+1;

            } catch(e) {
                if(player.onerror) player.onerror(e);
            }

            fetching=false;
        }

        await fetchChunk(0);
        await fetchChunk(nextByte);

        setInterval(()=>{

            if(!video.duration || video.readyState<2) return;

            const buffered = video.buffered.length ?
                video.buffered.end(video.buffered.length-1) : 0;

            if(buffered - video.currentTime < bufferAhead){
                fetchChunk(nextByte);
            }

        },500);

        video.addEventListener("seeking",()=>{

            const byte = Math.floor(fileSize*(video.currentTime/video.duration));
            nextByte = byte-(byte%chunkSize);
            fetchChunk(nextByte);

        });

    });

    return player;
}
}

window.RvXDrivePlayer = RvXDrivePlayer;
