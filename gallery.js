const gallery = document.getElementById("gallery");
const search = document.getElementById("search");
const sort = document.getElementById("sort");

const locationFilter = document.getElementById("locationFilter");
const deviceFilter = document.getElementById("deviceFilter");
const oemFilter = document.getElementById("oemFilter");
const rarityFilter = document.getElementById("rarityFilter");

let data = [];
let filtered = [];

/* ========= DETECTION RULES ========= */

const OEM_KEYWORDS = [
  "midea", "gree", "panasonic", "daikin",
  "lg", "samsung", "sharp", "hitachi",
  "aux", "hisense", "toshiba"
];

const RARITY_KEYWORDS = [
  "common", "uncommon", "rare", "very rare", "prototype"
];

function detectOEM(tags = []) {
  return tags.find(t =>
    OEM_KEYWORDS.includes(t.toLowerCase())
  ) || "";
}

function detectRarity(tags = []) {
  return tags.find(t =>
    RARITY_KEYWORDS.includes(t.toLowerCase())
  ) || "";
}

/* ========= LOAD DATA ========= */

fetch("gallery/gallery.json")
  .then(r => r.json())
  .then(json => {
    data = json.map(item => ({
      ...item,
      oem: detectOEM(item.tags),
      rarity: detectRarity(item.tags)
    }));

    filtered = [...data];
    populateFilters();
    render(filtered);
  })
  .catch(err => console.error(err));

/* ========= FILTER POPULATION ========= */

function addOptions(select, values) {
  [...values].sort().forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    select.appendChild(o);
  });
}

function populateFilters() {
  const locations = new Set();
  const devices = new Set();
  const oems = new Set();
  const rarities = new Set();

  data.forEach(i => {
    if (i.location) locations.add(i.location);
    if (i.device) devices.add(i.device);
    if (i.oem) oems.add(i.oem);
    if (i.rarity) rarities.add(i.rarity);
  });

  addOptions(locationFilter, locations);
  addOptions(deviceFilter, devices);
  addOptions(oemFilter, oems);
  addOptions(rarityFilter, rarities);
}

/* ========= RENDER ========= */

function createCard(item) {
  const card = document.createElement("div");
  card.className = "gallery-card";

  const img = document.createElement("img");
  img.src = item.src;
  img.loading = "lazy";

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.innerHTML = `
    <strong>${item.tags?.[0] || ""}</strong><br>
    ${item.location}<br>
    ${item.device}<br>
    ${item.date}
  `;

  card.append(img, overlay);
  card.onclick = () => openModal(item);
  return card;
}

function render(items) {
  gallery.innerHTML = "";
  items.forEach(i => gallery.appendChild(createCard(i)));
}

/* ========= FILTER + SEARCH ========= */

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

function applySort() {
  const v = sort.value;

  if (v === "newest") filtered.sort((a,b) => b.date.localeCompare(a.date));
  if (v === "oldest") filtered.sort((a,b) => a.date.localeCompare(b.date));
  if (v === "az") filtered.sort((a,b) => a.location.localeCompare(b.location));
  if (v === "za") filtered.sort((a,b) => b.location.localeCompare(a.location));

  render(filtered);
}

/* ========= EVENTS ========= */

search.addEventListener("input", applyFilters);
locationFilter.addEventListener("change", applyFilters);
deviceFilter.addEventListener("change", applyFilters);
oemFilter.addEventListener("change", applyFilters);
rarityFilter.addEventListener("change", applyFilters);
sort.addEventListener("change", applySort);

/* ========= MODAL ========= */

const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalMeta = document.getElementById("modal-meta");

function openModal(item) {
  modalImg.src = item.src;
  modalMeta.innerHTML = `
    <p>${item.date}</p>
    <p>${item.location}</p>
    <p>${item.device}</p>
    <p>${item.tags.join(", ")}</p>
  `;
  modal.classList.add("open");
}

document.querySelector(".close").onclick = () =>
  modal.classList.remove("open");

modal.onclick = e => {
  if (e.target === modal) modal.classList.remove("open");
};
