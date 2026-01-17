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
export {showLoader, hideLoader};
