const KEY = "RvX-NeoPlayer";

export function loadState(id) {
  const all = JSON.parse(localStorage.getItem(KEY) || "{}");
  return all[id] || null;
}

export function saveState(id, state) {
  const all = JSON.parse(localStorage.getItem(KEY) || "{}");
  all[id] = state;
  localStorage.setItem(KEY, JSON.stringify(all));
}
