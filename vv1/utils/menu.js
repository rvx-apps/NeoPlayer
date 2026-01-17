export default class MenuController {
  constructor(root) {
    this.root = root;
    this.panels = root.querySelectorAll(".subM");
    this.bind();
  }

  open(name) {
    this.panels.forEach(p => {
      p.classList.remove("active", "exit-left");
      if (p.dataset.menu === name) p.classList.add("active");
    });
  }

  bind() {
    this.root.querySelectorAll("[data-open]").forEach(item => {
      item.onclick = () => {
        const active = this.root.querySelector(".subM.active");
        if (active) active.classList.add("exit-left");
        this.open(item.dataset.open);
      };
    });

    this.root.querySelectorAll("[data-back]").forEach(btn => {
      btn.onclick = () => this.open("main");
    });
  }
                                                      }
