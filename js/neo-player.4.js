/*
   ....නමෝ බුද්ධාය!....
   Another Beautifull Advance Player From RvX Devs.......
*/

class NeoPlayer {
  constructor(container) {
    this.version = "1.0";
    this.playerST = JSON.parse(localStorage.getItem("RvX-Neo-Player-Config") || "{}");
    this.container = container;
    this.video = document.createElement("video");
    this.container.appendChild(this.video);
    this.sources = JSON.parse(container.dataset.sources || "[]");
    this.old = false;
    if(this.sources == this.playerST?.source?.sources){
        //this.old = true;
    }
    this.poster = this.old ? playerST.source.poster : container.dataset.poster;
    this.subtitles = this.old ? playerST.source.subtitles : JSON.parse(container.dataset.subtitles || "[]");
    this.subs = [];
    this.sub_settings = this.old ? playerST.sub_settings : {
        on:true,
        size:"18px",
        color:"#ffffff"
    };
    this.video.currentTime = this.old ? playerST.currentTime : 0;
    if(!this.playerST || this.playerST == {}) {
        this.playerST = {
            currentTime:this.video.currentTime,
            source:{
                sources:this.sources,
                poster:this.video.poster,
                subtitle:this.subtitles
            }
        };
        console.log(JSON.stringify(this.playerST));
        this.saveDT()    
    }
    this.loader = null;
    this.skipranges = JSON.parse(container.dataset.skipranges || "[]").map(x=>{
        x.start = timeStringToMs(x.start) / 1000;
        x.end = timeStringToMs(x.end)/1000;
        return x;
    });
    loadPlayerDeps({
      css: [
         "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded",
         "https://cdn.jsdelivr.net/gh/rvx-apps/NeoPlayer@main/css/neo-player.2.css",
         "https://cdn.jsdelivr.net/gh/rvx-apps/NeoPlayer@main/css/neo-player.media.1.css"
      ],
      js: [
         "https://cdn.jsdelivr.net/npm/sweetalert2@11",
         "https://cdn.jsdelivr.net/npm/hls.js@latest"
      ]
   }).then(() => {
      console.log("Player dependencies ready");
      //initVideoPlayer(); // your init function

      this.saveDT();
      //console.log(JSON.stringify(this.skipranges));
      this.buildUI();
      this.loadSource(this.sources[0]);
      this.bindEvents();
      this.bindVideoLoadingEvents();
      this.toggleControls(1);
   });
  }
  
  saveDT(){
      localStorage.setItem('RvX-Neo-Player-Config', JSON.stringify(this.playerST));
  }

  buildUI() {
    this.statLayer = document.createElement("div");
    this.statLayer.className = "statLayer";
    this.statLayer.innerHTML = `
               <div class="batterylevel">
                   <span class="material-symbols-rounded icon">battery_android_frame_4</span>
                   <span class="value"></span>% |&nbsp; <span class="remainTime">1382min</span>
               </div>
               <div class="timeShow"></div>
    `;
    this.container.appendChild(this.statLayer);
    this.optionsBackdrop = document.createElement("div");
    this.optionsBackdrop.id = "sheetBackdrop";
    this.optionsBackdrop.className = "sheet-backdrop";
    this.container.appendChild(this.optionsBackdrop);
    this.optionsM = document.createElement("div");
    this.optionsM.id = "bottomSheet";
    this.optionsM.className = "bottom-sheet";
    this.optionsM.innerHTML =`
     <div class="sheet-handle"></div>
      
      <div class="sheet-item" data-open="subtitleSection">
        <span class="material-symbols-rounded">subtitles</span>
        <span>Captions | Subtitles</span>
      </div>
      
      <div class="sheet-item" data-open="speedSection">
        <span class="material-symbols-rounded">speed</span>
        <span>Playback Speed</span>
      </div>
      
      <div class="sheet-item" id="statTg">
        <span class="material-symbols-rounded">movie_info</span>
        <span>Stats</span>
        <span class="material-symbols-rounded tgl">toggle_on</span>
      </div>
      
      <div class="sheet-item videoFill">
        <span class="material-symbols-rounded">fit_screen</span>
        <span>Fit Screen View</span>
      </div>
      
      <div class="sheet-item feedback" >
        <span class="material-symbols-rounded">feedback</span>
        <span>Feedback</span>
      </div>
      
      <div class="sheet-footer">
          💙 Neo Player : Player By RvX™ ❤️<br><br><span>•Github | Email</span>
      </div>
      
      <div class="subM speedSection" data-menu="speedSection">
              <div class="menu-header" data-back>
                  <span class="material-symbols-rounded">arrow_back</span>
                  <span>Select Playback Speed ⏱️</span>
              </div>

              <div class="menu-item speedItem">0.5</div>
              <div class="menu-item speedItem">1</div>
              <div class="menu-item speedItem">1.5</div>
              <div class="menu-item speedItem">2</div>
      </div>
      <div class="subM subtitleSection" data-menu="subtitleSection">
              <div class="menu-header" data-back>
                  <span class="material-symbols-rounded">arrow_back</span>
                  <span>Custom Subtitles ✍🏻</span>
              </div>

              <!-- COLOR -->
              <div class="menu-row">
              <span>Text Color 🎨</span>
              <label class="color-btn">
                <input type="color" id="subColor" value="#ffffff">
                <span class="color-preview"></span>
              </label>
            </div>

            <!-- SIZE -->
            <div class="menu-row">
              <span>Font Size 📏</span>
              <span class="capsize">18px</span>
              <input type="range" id="subSize" min="12" max="48" value="22">
            </div>
            
            <div class="menu-row">
              <span>Reset Settings 🛠️</span>
              <div class="resetCapS borderbutton">Reset</div>
            </div>
     </div>
      
      `;
    this.container.appendChild(this.optionsM);
    this.optionsitems = this.optionsM.querySelectorAll(".sheet-item");
    this.posterLayer = document.createElement("div");
    this.posterLayer.className = "thumb-warp";
    this.posterLayer.innerHTML = `<img src="${this.poster}" alt="${this.title}">`;
    this.container.appendChild(this.posterLayer);
    this.controlshandlelayer = document.createElement("div");
    this.controlshandlelayer.className = "controlshandlelayer";
    this.container.appendChild(this.controlshandlelayer);
    this.loadingLayer = document.createElement("div");
    this.loadingLayer.className = "loaderlayer";
    this.container.appendChild(this.loadingLayer);
    this.controls = document.createElement("div");
    this.controls.className = "controls allcontrols";
    this.maincontrols = document.createElement("div");
    this.maincontrols.className = "maincontrols allcontrols";
    this.maincontrols.innerHTML = `
      <span class="material-symbols-rounded replay10btn circle-icon" >replay_10</span>
      <span class="material-symbols-rounded mainplaybtn circle-icon" >play_circle</span>
      <span class="material-symbols-rounded forward10btn circle-icon">forward_10</span>
    `;
    this.container.appendChild(this.maincontrols);
    this.skipDV = document.createElement("div");   
    this.skipDV.className = "skipDV";
    this.skipDV.textContent = "";
    this.container.appendChild(this.skipDV);
    this.sublayer = document.createElement("div");
    this.sublayer.className = "sublayer";
    this.sublayer.innerHTML = `<p class="subtitle">subtitle here</p>`;
    this.container.appendChild(this.sublayer);
    
    this.controls.innerHTML = `
      <button class="play"><span class="material-symbols-rounded smallplaybtnicon">play_arrow</span></button>
      <input type="range" class="seek" min="0" max="100" value="0">
      <span class="time">0:00 / 0:00</span>
      <span class="material-symbols-rounded setting settingbtnicon">settings</span>

      <select class="quality"></select>
      <select class="subs">
          <option value="null">CC</option>
      </select>

      <button class="pip"></button>
      <button class="fullscreen"><span class="material-symbols-rounded fullscreenbtnicon">fullscreen</span></button>
    `;
    this.container.appendChild(this.controls);

    this.playBtn = this.controls.querySelector(".play");
    this.settingBtn = this.controls.querySelector(".setting");
    this.speedItems = this.optionsM.querySelectorAll(".speedItem");
    this.subSizeRange = this.optionsM.querySelector("#subSize");
    this.subSizeShow = this.optionsM.querySelector(".capsize");
    this.subColor = this.optionsM.querySelector("#subColor");
    this.resetSubS = this.optionsM.querySelector(".resetCapS");
    this.seek = this.controls.querySelector(".seek");
    this.time = this.controls.querySelector(".time");
    this.statbtn = this.optionsM.querySelector("#statTg");
    this.quality = this.controls.querySelector(".quality");
    this.subselect = this.controls.querySelector(".subs");
    this.fullscreen = this.controls.querySelector(".fullscreen");
    this.fillBtn = this.optionsM.querySelector(".videoFill");
    this.pip = this.controls.querySelector(".pip");
    this.subtext = this.sublayer.querySelector(".subtitle");
    this.mainplayBtn = this.maincontrols.querySelector(".mainplaybtn");
    this.replay10Btn = this.maincontrols.querySelector(".replay10btn");
    this.forward10Btn = this.maincontrols.querySelector(".forward10btn");
    this.feedbackBtn = this.optionsM.querySelector(".feedback");
    
    this.feedbackBtn.onclick = () => {
          this.openFeedbackEmail({
            
            subject: "Video Player Feedback",
            body:`Hi Team,

I want to report feedback:
• About: Neo Player By RvX Team,

• Issue: WRITE HERE!

• Device:${navigator.userAgent},
• Date: ${new Date().toLocaleString()},
• Player version: ${this.version}

Thanks!`
      });
    };
    
    this.fillBtn.onclick = ()=> this.toggleVideoFill();
    
    this.statbtn.onclick = (e) => {
        var el = e.target.querySelector(".sw");
        this.toggleST();
    }
    this.subColor.oninput = (e) => {
        var v = e.target.value;
        this.subtext.style.color = v;
    }
    
    this.resetSubS.onclick = () => {
        this.subtext.style.color = this.sub_settings.color;
        this.subtext.style.fontSize = this.sub_settings.size;
        this.subSizeRange.value = this.sub_settings.size;
        this.subSizeShow.textContent = this.sub_settings.size;
        this.subColor.value = this.sub_settings.color;
    }
    this.subSizeRange.oninput = (e) => {
        var v = e.target.value;
        this.subtext.style.fontSize = `${v}px`;
        this.subSizeShow.textContent = `${v}px`;
        
    }
    
    this.speedItems.forEach((el,i)=>{
        el.onclick =()=> this.video.playbackRate = Number(el.textContent);
        console.log(this.video.playbackRate);
    });
    
    this.sources.forEach((s,i)=>{
      let o=document.createElement("option");
      o.value=i;o.text=s.label;
      this.quality.appendChild(o);
    });

    this.subtitles.forEach((s,i)=>{
      let o=document.createElement("option");
      o.value=i;o.text=s.label;
      this.subselect.appendChild(o);
    });
    
    this.subselect.onchange = async (e) => {
        var v = e.target.value;
        if (v == "") {
            this.subs = [];
            this.sub_settings.on = false;
            return;
        }
        //console.log(v);
        this.sub_settings.on = true;
        var sub = this.subtitles[v];
        await this.loadSub(sub.src);
        console.log(sub.src);
    }
  }
  
  toggleST(){
      console.log(this.statLayer.classList.contains("show"));
      if(this.statLayer.classList.contains("show")){
          this.statLayer.classList.remove("show");
          this.statbtn.querySelector(".tgl").textContent = "toggle_on";
      }else{
          this.statLayer.classList.add("show");
          this.statbtn.querySelector(".tgl").textContent = "toggle_off";
          
      }
  }

  loadSource(source) {
    this.video.src = source.src;
    this.video.load();
  }
  
  async loadSub(url) {
      const txt = await fetch(url).then(r => r.text());
      //console.log(txt);
      if (url.endsWith(".srt")) this.subs = parseSub(txt);
      if (url.endsWith(".vtt")) this.subs = parseSub(txt);
      //console.log(JSON.stringify(this.subs));
  }
  
  secFormat(totalSeconds) {
      if(!totalSeconds) return "00:00";
      totalSeconds = Math.max(0, Math.floor(totalSeconds));

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const rt =[
        Number(hours.toString().padStart(2, "0")) ? hours.toString().padStart(2, "0"):null,
        minutes.toString().padStart(2, "0"),
        seconds.toString().padStart(2, "0")
      ];
      return rt.filter(e=>e).join(":");
  }
  
  toggleVideoFill(){
      this.video.classList.toggle("fill");
  }
  
  playOrPause() {
      this.video.paused ? this.video.play() : this.video.pause();
  }
  
  onFullscreenChange() {
      const isFs = isFullscreen();
      this.fullscreen.querySelector("span").textContent = isFs? "close_fullscreen" : "fullscreen";
  }
  
  toggleControls(x=null) {
      if(this.controlsTimer && this.container.classList.contains("show-controls")){
          clearTimeout(this.controlsTimer);
          if (!this.video.paused) {
              this.container.classList.remove("show-controls");
              //this.statLayer.style.opacity = 1;
          }
      }else{
          this.container.classList.add("show-controls");
          clearTimeout(this.controlsTimer);
          this.controlsTimer = setTimeout(() => {
            this.container.classList.remove("show-controls");
          }, 3000);
      }
      if (x==18) {
          this.container.classList.add("show-controls");
          clearTimeout(this.controlsTimer);
      }else if(x==2){
          this.container.classList.add("show-controls");
          clearTimeout(this.controlsTimer);
          this.controlsTimer = setTimeout(() => {
            this.container.classList.remove("show-controls");
          }, 3000);
      }
  }
  
  bindVideoLoadingEvents() {
    const show = () => {
      if (!this.loader) {
        this.loader = showLoader(this.container);
      }
    };

    const hide = () => {
      if (this.loader) {
        hideLoader(this.loader);
        this.loader = null;
      }
    };

    this.video.onloadstart = () => show();
    this.video.onwaiting   = () => show();
    this.video.onseeking   = () => show();
    this.video.onstalled   = () => show();

    this.video.oncanplay   = () => hide();
    this.video.onended    = () => hide();
    this.video.onplay = () => {
         this.playBtn.querySelector("span").textContent ="pause";
         this.mainplayBtn.textContent = "pause_circle";
         this.posterLayer.style.display = "none";
         hide();
     }
    this.video.onpause = () => {
         this.playBtn.querySelector("span").textContent ="play_arrow";
         this.mainplayBtn.textContent = "play_circle";   
         //this.posterLayer.style.display = "";
         hide();
     }
  }
  
  openSheet() {
    this.optionsM.classList.add("show");
    this.optionsBackdrop.classList.add("show");
  }
  
  closeSheet() {
    this.optionsM.classList.remove("show");
    this.optionsBackdrop.classList.remove("show");
  }
  
  getTime12() {
      const d = new Date();
      let h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
  }

  bindEvents() {
    this.container.addEventListener("contextmenu", e => {
      e.preventDefault();
      this.openSheet();
    });
    this.optionsBackdrop.onclick = ()=> this.closeSheet();
    this.container.onclick = () => this.toggleControls();
    document.onfullscreenchange = () => this.onFullscreenChange();
    this.mainplayBtn.onclick = () => this.playOrPause();
    this.replay10Btn.onclick = () => this.video.currentTime -= 10;
    this.forward10Btn.onclick = () => this.video.currentTime += 10;
    
    this.settingBtn.onclick = () => this.openSheet();
    this.playBtn.onclick = () =>
      this.video.paused ? this.video.play() : this.video.pause();
    
    this.video.ontimeupdate = () => {
      this.saveDT();
      this.seek.value = (this.video.currentTime / this.video.duration) * 100;
      this.time.textContent =
        this.secFormat(this.video.currentTime) + " / " +
        this.secFormat(this.video.duration);
        
      if (this.skipranges) {
        //console.log(this.video.currentTime);
        var flct = Math.floor(this.video.currentTime);
        //console.log(flct);
        var skippable = this.skipranges.find(x=> x.start < this.video.currentTime && this.video.currentTime < x.end);
        //console.log(JSON.stringify(skippable));
        if (skippable) {
            this.skipDV.textContent =`skip ${skippable.info} >>`;
            this.skipDV.onclick = () => {
                this.video.currentTime = skippable.end;
                //console.log(skippable.end);
               }
            this.skipDV.style.display ="block";
        }else{
            this.skipDV.style.display ="none";
            this.skipDV.onclick = null;
        }
      }
      
      /*Update top layer*/
      this.statLayer.querySelector(".timeShow").textContent = this.getTime12();
      var remainT = Math.floor((this.video.duration - this.video.currentTime));
      this.statLayer.querySelector(".remainTime").textContent = `${this.secFormat(remainT)}`;
      if ("getBattery" in navigator) {
          navigator.getBattery().then(b => {
            //console.log(b.level * 100 + "%");
            this.statLayer.querySelector(".batterylevel .value").textContent = b.level*100;
            var vl = Math.floor(b.level *100);
            var vk = `battery_android_frame_${Math.floor(vl / 16.66)}`;
            if(vl == 100) vk = "battery_android_frame_full";
            if(vl == 0) vk = "battery_android_alert"
            var btl = this.statLayer.querySelector(".batterylevel .icon");
            btl.textContent=`${vk}`;
            if(vl <= 15) btl.style.color = "#ff0a00";
            if(40 >= vl > 15) btl.style = "#ff9315";
            if(60 >= vl > 40 ) btl.style.color = "#ffffff";
            if(90 >= vl > 60) btl.style.color = "#c4ff6a";
            if(vl > 90) btl.style.color = "#51ff2b";
          });
        } else {
          console.log("Battery API not supported");  
        }
      
     
      if (!this.sub_settings.on || !this.subs?.length) {
          this.subtext.replaceChildren();
          this._lastSubKey = "";
          return;
        }

        const t = this.video.currentTime;

        // get all active subtitles (supports overlaps)
        const active = this.subs.filter(s => s.start <= t && t < s.end);

        // prevent unnecessary re-render (no flicker)
        const key = active.map(s => s.start + "-" + s.end).join("|");
        if (key === this._lastSubKey) return;
        this._lastSubKey = key;

        // clear old subtitles
        this.subtext.replaceChildren();

        // render each subtitle separately
        for (const s of active) {
          const line = document.createElement("div");
          line.className = "subtitle-line";
          line.textContent = s.text;
          this.subtext.appendChild(line);
        }
        
        
    };

    this.seek.oninput = () =>
      this.video.currentTime = ( this.seek.value / 100 ) * this.video.duration;

    //this.speed.onchange = () => this.video.playbackRate = this.speed.value;

    this.quality.onchange = () => {
      let t=this.video.currentTime;
      this.loadSource(this.sources[this.quality.value]);
      this.video.currentTime=t;
      this.video.play();
    };

    this.fullscreen.onclick = () => {
      if (!isFullscreen()) {
        this.container.requestFullscreen();
        this.fullscreen.querySelector("span").textContent = "close_fullscreen";
      }else{
        document.exitFullscreen();
        this.fullscreen.querySelector("span").textContent = "fullscreen";
      }
    }

    this.pip.onclick = async () => {
      if (document.pictureInPictureElement)
        document.exitPictureInPicture();
      else
        await this.video.requestPictureInPicture();
    };

    document.addEventListener("keydown", e => {
      if (e.code==="Space") {
        e.preventDefault();
        this.video.paused?this.video.play():this.video.pause();
      }
      if (e.key==="ArrowRight") this.video.currentTime+=5;
      if (e.key==="ArrowLeft") this.video.currentTime-=5;
    });
  }

  format(t){
    if(!t) return "0:00";
    let m=Math.floor(t/60);
    let s=Math.floor(t%60).toString().padStart(2,"0");
    return `${m}:${s}`;
  }
  
  openFeedbackEmail({ subject, body }) {
  const url =
    `mailto:${encodeURIComponent("rvx.neoplayer.feedback@gmail.com")}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  window.location.href = url;
}

}

/*Load files*/
function loadCSS(href) {
  return new Promise((resolve) => {
    if ([...document.styleSheets].some(s => s.href && s.href.includes(href))) {
      return resolve("css-already-loaded");
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve("css-loaded");
    document.head.appendChild(link);
  });
}
function loadJS(src) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some(s => s.src.includes(src))) {
      return resolve("js-already-loaded");
    }

    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.onload = () => resolve("js-loaded");
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
async function loadPlayerDeps({ css = [], js = [] }) {
  for (const c of css) await loadCSS(c);
  for (const j of js) await loadJS(j);
}
         
document.querySelectorAll(".neo-player")
  .forEach(p=>{
         new NeoPlayer(p);
  });

document.querySelectorAll(".neo-player").forEach(p=>{
  const video=p.querySelector("video");
  const src=p.dataset.hls;
  if(src && Hls.isSupported()){
    const hls=new Hls();
    hls.loadSource(src);
    hls.attachMedia(video);
  }
});

function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

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

function openMenu(name) {
  panels = document.querySelectorAll(".subM");
  panels.forEach(p => {
    p.classList.remove("active", "exit-left");
    if (p.dataset.menu === name) {
      p.classList.add("active");
    }
  });
}

document.querySelectorAll("[data-open]").forEach(item => {
  item.onclick = () => {
    const target = item.dataset.open;
    op = document.querySelector(".subM.active")
    if(op)op.classList.add("exit-left");
    openMenu(target);
  };
});

document.querySelectorAll("[data-back]").forEach(btn => {
  btn.onclick = () => openMenu("main");
});

function showLoader(target) {
  if (getComputedStyle(target).position === "static") {
    target.style.position = "relative";
  }

  const wrap = document.createElement("div");
  wrap.className = "g-loader-wrap";

  wrap.innerHTML = `
    <svg class="g-loader-svg" viewBox="25 25 50 50">
      <circle class="g-loader-circle" cx="50" cy="50" r="20"></circle>
    </svg>
  `;

  target.appendChild(wrap);
  return wrap;
}

function hideLoader(loader) {
  loader?.remove();
}
