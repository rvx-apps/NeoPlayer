/*
   ....නමෝ බුද්ධාය!....
   Another Beautifull Advance Player From RvX Devs.......
*/
import {loadPlayerDeps}  from "https://cdn.jsdelivr.net/gh/rvx-apps/NeoPlayer@main/vv1/utils/loadlibs.js";
import MenuController from "https://cdn.jsdelivr.net/gh/rvx-apps/NeoPlayer@main/vv1/utils/menu.js";
import {isFullscreen} from "https://cdn.jsdelivr.net/gh/rvx-apps/NeoPlayer@main/vv1/utils/fullscreenhelp.js";
import {showLoader, hideLoader} from "https://cdn.jsdelivr.net/gh/rvx-apps/NeoPlayer@main/vv1/utils/loader.js";
import {parseSRT,parseVTT,parseSub} from "https://cdn.jsdelivr.net/gh/rvx-apps/NeoPlayer@main/vv1/utils/subtitles2.js";
import {timeStringToMs, toSeconds} from "https://cdn.jsdelivr.net/gh/rvx-apps/NeoPlayer@main/vv1/utils/timeformat.js";
import NeoKeyboard from "https://cdn.jsdelivr.net/gh/rvx-apps/NeoPlayer@main/vv1/utils/keyboard.js";
import { loadState, saveState } from "https://cdn.jsdelivr.net/gh/rvx-apps/NeoPlayer@main/vv1/utils/storage.js";
import { getDriveSource } from "https://cdn.jsdelivr.net/gh/rvx-apps/NeoPlayer@main/vv1/plugins/gDrive.js";

class NeoPlayer {
  constructor(container) {
    this.version = "1.0";
    this.container = container;
    this.video = document.createElement("video");
    this.container.appendChild(this.video);
    this.sources = JSON.parse(container.dataset.sources || "[]");
    this.id = container.dataset.id || location.pathname;
    this.old = false;
    this.poster = container.dataset.poster || null;
    this.subtitles = JSON.parse(container.dataset.subtitles || "[]");
    this.subs = [];
    this.fillmode = false;
    this.subTP = false;
    this.sub_settings =  {
        on:false,
        size:"18px",
        color:"#ffffff",
        selected:0
    };
    this.state = loadState(this.id) || {};
    this.video.currentTime = 0;
    this.loader = null;
    this.skipranges = JSON.parse(container.dataset.skipranges || "[]").map(x=>{
        x.start = timeStringToMs(x.start) / 1000;
        x.end = timeStringToMs(x.end)/1000;
        return x;
    });
    loadPlayerDeps({
      css: [
         "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded",
         "https://cdn.jsdelivr.net/gh/rvx-apps/NeoPlayer@main/css/neo-player.3.css",
         "https://cdn.jsdelivr.net/gh/rvx-apps/NeoPlayer@main/css/neo-player.media.3.css"
      ],
      js: [
         "https://cdn.jsdelivr.net/npm/sweetalert2@11",
         "https://cdn.jsdelivr.net/npm/hls.js@latest"
      ]
   }).then(() => {
      console.log("Player dependencies ready");
      //initVideoPlayer(); // your init function
      //console.log(JSON.stringify(this.skipranges));
      this.buildUI();
      this.loadSource(this.sources[0]);
      this.bindEvents();
      this.bindVideoLoadingEvents();
      this.toggleControls(1);
      this.bindOldSetup();
      this.askResume();
   });
  }
  async loaddrivefile(id){
     this.sources = await getDriveSource(id);
     this.setupQs();
  }
   
  setupQs(){
   this.quality.innerHTML ="";
   this.sources.forEach((s,i)=>{
      let o=document.createElement("option");
      o.value=i;o.text=s.label;
      this.quality.appendChild(o);
    });
  }
   
  bindOldSetup(){
     if (this.state.sub) { this.sub_settings = this.state.sub;this.setupSub();}
     if (this.state.fillmode) this.video.classList.toggle("fill",this.state.fillmode);
     this.setupSub();
  }
     /* ---------- Resume ---------- */
  askResume() {
    if (!this.state.time) return;
    Swal.fire({
      title: "Resume playback?",
      text: `Continue from ${this.secFormat(this.state.time)} ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Resume",
      cancelButtonText: "Restart"
    }).then(async res => {
      if (res.isConfirmed) {
        this.video.currentTime = this.state.time;
        if(this.state.sub.on){
          this.subselect.selectedIndex = Number(this.state.sub.selected)+1;
          await this.loadSub(this.state.subfile);    
         }
        this.video.onload = () => this.video.play();
      }
    });
  }

  /* ---------- Core ---------- */
  save() {
    saveState(this.id, {
      time: this.video.currentTime,
      src: this.video.src,
      sub:this.sub_settings,
      subfile:this.subfile,
      fillmode:this.fillmode,
      textSub:this.subTP
    });
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
    this.menu_s = new MenuController(this.container);
    this.keyboard = new NeoKeyboard(this);
    this.keyboard.init();
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
    
    this.fillBtn.onclick = ()=> {
       this.toggleVideoFill();
    };
    
    this.statbtn.onclick = (e) => {
        var el = e.target.querySelector(".sw");
        this.toggleST();
    }
    this.subColor.oninput = (e) => {
        var v = e.target.value;
        this.subtext.style.color = v;
        this.sub_settings.color= v;
    }
    
    this.resetSubS.onclick = () => {
        this.subtext.style.color = this.sub_settings.color;
        this.subtext.style.fontSize = this.sub_settings.size;
        this.subSizeRange.value = this.sub_settings.size;
        this.subSizeShow.textContent = this.sub_settings.size;
        this.subColor.value = this.sub_settings.color;
        this.sub_settings ={on:false,color:"#ffffff",size:"18px"};
    }
    this.subSizeRange.oninput = (e) => {
        var v = e.target.value;
        this.subtext.style.fontSize = `${v}px`;
        this.subSizeShow.textContent = `${v}px`;
        this.sub_settings.size= `${v}px`;
    }
    
    this.speedItems.forEach((el,i)=>{
        el.onclick =()=> this.video.playbackRate = Number(el.textContent);
        //console.log(this.video.playbackRate);
    });

    this.setupQs();

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
            this.sub_settings.selected = null;
            return;
        }
        //console.log(v);
        this.sub_settings.on = true;
        var sub = this.subtitles[v];
        this.sub_settings.selected = sub;
        await this.loadSub(sub.src);
        console.log(sub.src);
    }
  }
  setupSub(){
     this.subtext.style.color = this.sub_settings.color;
     this.subtext.style.fontSize = this.sub_settings.size;
     this.subColor.value = this.sub_settings.color;
     this.subSizeRange.value = this.sub_settings.size;
     this.subSizeShow.textContent = this.sub_settings.size;
  }
  renderSubs (){
     this.subtitles.forEach((s,i)=>{
      let o=document.createElement("option");
      o.value=i;o.text=s.label;
      this.subselect.appendChild(o);
    });
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
  
  async loadSub(url,stxt = false) {
      if(!url) return;
      if(stxt){
       this.subs = parseSub(url);
       this.sub_settings.on = true;
       this.save();
       return;
      }
      this.subfile=url;
      this.subTP = stxt;
      const txt = await fetch(url).then(r => r.text());
      //console.log(txt);
      if (url.endsWith(".srt")) this.subs = parseSub(txt);
      if (url.endsWith(".vtt")) this.subs = parseSub(txt);
      this.save();
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
      this.fillmode = this.video.classList.contains("fill");
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
      if(this.video.currentTime > 30) this.save();
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
      const btl = this.statLayer.querySelector(".batterylevel .icon");  
      const btlv = this.statLayer.querySelector(".batterylevel .value");
       if ("getBattery" in navigator) {
          navigator.getBattery().then(b => {
            //console.log(b.level * 100 + "%");
            btlv.textContent = b.level*100;
            var vl = Math.floor(b.level *100);
            var vk = `battery_android_frame_${Math.floor(vl / 16.66)}`;
            if(vl == 100) vk = "battery_android_frame_full";
            if(vl <= 15) vk = "battery_android_alert"
            btl.textContent=`${vk}`;
            if(vl <= 15) btl.style.color = "#ff0a00";
            if(40 >= vl > 15) btl.style = "#ff9315";
            if(60 >= vl > 40 ) btl.style.color = "#ffffff";
            if(90 >= vl > 60) btl.style.color = "#c4ff6a";
            if(vl > 90 || b.charging) btl.style.color = "#51ff2b";
          });
        } else {
          console.log("Battery API not supported");  
          btl.textContent = "battery_android_frame_question";
          btl.color="white";
          btlv.textContent = "ERR";
        }
      
     
      if (!this.sub_settings.on || !this.subs?.length) {
          this.subtext.replaceChildren();
          this._lastSubKey = "";
          return;
        }
        const t = this.video.currentTime;
        const active = this.subs.filter(s => s.start <= t && t < s.end);
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

window.NeoPlayer = NeoPlayer;
export default NeoPlayer;
