const gallery = document.getElementById("gallery");
const search = document.getElementById("search");
const sort = document.getElementById("sort");

const locationFilter = document.getElementById("locationFilter");
const deviceFilter = document.getElementById("deviceFilter");
const oemFilter = document.getElementById("oemFilter");
const rarityFilter = document.getElementById("rarityFilter");

let data = [];
let filtered = [];

/* LOAD JSON */
fetch("gallery/gallery.json")
  .then(r => r.json())
  .then(json => {
    data = json;
    filtered = [...data];
    populateFilters();
    applyFilters();
  })
  .catch(err => console.error("Gallery load failed:", err));

/* POPULATE DROPDOWNS */
function populateFilters() {
  fill(locationFilter, unique("location"));
  fill(deviceFilter, unique("device"));
  fill(oemFilter, unique("oem"));
  fill(rarityFilter, unique("rarity"));
}

function unique(key) {
  return [...new Set(data.map(i => i[key]).filter(Boolean))].sort();
}

function fill(select, values) {
  values.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    select.appendChild(o);
  });
}

/* FILTER + SEARCH */
function applyFilters() {
  const q = search.value.toLowerCase();
  const loc = locationFilter.value;
  const dev = deviceFilter.value;
  const oem = oemFilter.value;
  const rarity = rarityFilter.value;

  filtered = data.filter(i => {
    const text = [
      i.location,
      i.device,
      i.oem,
      i.rarity,
      ...(i.tags || [])
    ].join(" ").toLowerCase();

    if (q && !text.includes(q)) return false;
    if (loc && i.location !== loc) return false;
    if (dev && i.device !== dev) return false;
    if (oem && i.oem !== oem) return false;
    if (rarity && i.rarity !== rarity) return false;

    return true;
  });

  applySort();
}

/* SORT */
function applySort() {
  const v = sort.value;

  if (v === "newest") filtered.sort((a,b) => b.date.localeCompare(a.date));
  if (v === "oldest") filtered.sort((a,b) => a.date.localeCompare(b.date));
  if (v === "az") filtered.sort((a,b) => a.location.localeCompare(b.location));
  if (v === "za") filtered.sort((a,b) => b.location.localeCompare(a.location));

  render();
}

/* RENDER */
function render() {
  gallery.innerHTML = "";
  filtered.forEach(i => gallery.appendChild(card(i)));
}

function card(item) {
  const c = document.createElement("div");
  c.className = "gallery-card";

  const img = document.createElement("img");
  img.src = item.src;
  img.loading = "lazy";

  const o = document.createElement("div");
  o.className = "overlay";
  o.innerHTML = `
    <strong>${item.tags[0]}</strong><br>
    ${item.location}<br>
    ${item.device}<br>
    ${item.date}
  `;

  c.append(img, o);
  c.onclick = () => openModal(item);
  return c;
}

/* MODAL */
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalMeta = document.getElementById("modal-meta");

function openModal(item) {
  modalImg.src = item.src;
  modalMeta.innerHTML = `
    <p><strong>Date:</strong> ${item.date}</p>
    <p><strong>Location:</strong> ${item.location}</p>
    <p><strong>Device:</strong> ${item.device}</p>
    <p><strong>OEM:</strong> ${item.oem}</p>
    <p><strong>Rarity:</strong> ${item.rarity}</p>
    <p>${item.tags.join(", ")}</p>
  `;
  modal.classList.add("open");
}

document.querySelector(".close").onclick = () =>
  modal.classList.remove("open");

modal.onclick = e => {
  if (e.target === modal) modal.classList.remove("open");
};

/* EVENTS */
search.addEventListener("input", applyFilters);
locationFilter.addEventListener("change", applyFilters);
deviceFilter.addEventListener("change", applyFilters);
oemFilter.addEventListener("change", applyFilters);
rarityFilter.addEventListener("change", applyFilters);
sort.addEventListener("change", applySort);
