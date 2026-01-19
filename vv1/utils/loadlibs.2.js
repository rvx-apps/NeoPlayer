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
function loadJS(j) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some(s => s.src.includes(j.src))) {
      return resolve("js-already-loaded");
    }

    const script = document.createElement("script");
    script.src = j.src;
    script.defer = true;
    script.onload = () => resolve("js-loaded");
    script.onerror = reject;
    if(j.head){
      document.head.appendChild(script);
    }else{
      document.body.appendChild(script);
    }
  });
}
async function loadPlayerDeps({ css = [], js = [] }) {
  for (const c of css) await loadCSS(c);
  for (const j of js) await loadJS(j);
}
export {loadPlayerDeps};
