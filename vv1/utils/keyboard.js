export default class NeoKeyboard {
  constructor(player) {
    this.player = player;
    this.video = player.video;

    this.onKeyDown = this.onKeyDown.bind(this);
  }

  init() {
    document.addEventListener("keydown", this.onKeyDown);
  }

  destroy() {
    document.removeEventListener("keydown", this.onKeyDown);
  }

  onKeyDown(e) {
    // Ignore typing in inputs
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.isContentEditable
    ) return;

    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault();
        this.togglePlay();
        break;

      case "ArrowRight":
        this.seekBy(5);
        break;

      case "ArrowLeft":
        this.seekBy(-5);
        break;

      case "ArrowUp":
        e.preventDefault();
        this.changeVolume(0.05);
        break;

      case "ArrowDown":
        e.preventDefault();
        this.changeVolume(-0.05);
        break;

      case "f":
        this.toggleFullscreen();
        break;

      case "m":
        this.video.muted = !this.video.muted;
        break;

      case ">":
      case ".":
        this.changeSpeed(0.25);
        break;

      case "<":
      case ",":
        this.changeSpeed(-0.25);
        break;

      case "0":
        this.video.currentTime = 0;
        break;

      default:
        // Number keys 1–9 = seek %
        if (/^[1-9]$/.test(e.key)) {
          const percent = Number(e.key) / 10;
          this.video.currentTime = this.video.duration * percent;
        }
    }
  }

  togglePlay() {
    this.video.paused ? this.video.play() : this.video.pause();
  }

  seekBy(sec) {
    this.video.currentTime = Math.max(
      0,
      Math.min(this.video.duration, this.video.currentTime + sec)
    );
  }

  changeVolume(delta) {
    this.video.volume = Math.max(
      0,
      Math.min(1, this.video.volume + delta)
    );
  }

  changeSpeed(delta) {
    this.video.playbackRate = Math.max(
      0.25,
      Math.min(4, this.video.playbackRate + delta)
    );
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.player.container.requestFullscreen();
    }
  }
  }
