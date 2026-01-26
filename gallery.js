// ===== ELEMENTS =====
const gallery = document.getElementById("gallery");
const search = document.getElementById("search");
const sort = document.getElementById("sort");
const locationFilter = document.getElementById("locationFilter");
const deviceFilter = document.getElementById("deviceFilter");
const oemFilter = document.getElementById("oemFilter");
const rarityFilter = document.getElementById("rarityFilter");

// ===== STATE =====
let data = [];
let filtered = [];

// ===== LOAD DATA =====
fetch("gallery/gallery.json")
  .then(res => {
    if (!res.ok) throw new Error("JSON not found");
    return res.json();
  })
  .then(json => {
    data = json;
    filtered = [...data];
    populateFilters();
    applyFilters();
  })
  .catch(err => console.error("Gallery load failed:", err));

// ===== FILTER DROPDOWNS =====
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

function addOptions(select, values) {
  values.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    select.appendChild(o);
  });
}

// ===== RENDER =====
function render(items) {
  gallery.innerHTML = "";
  if (!items.length) return;

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "gallery-card";

    const img = document.createElement("img");
    img.src = item.src;
    img.loading = "lazy";

    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `
      <strong>${item.tags?.[0] || ""}</strong><br>
      ${item.location || ""}<br>
      ${item.date || ""}<br>
      ${item.device || ""}
    `;

    card.append(img, overlay);
    card.addEventListener("click", () => openModal(item));
    gallery.appendChild(card);
  });
}

// ===== FILTERING =====
function applyFilters() {
  const q = search.value.trim().toLowerCase();
  const loc = locationFilter.value;
  const dev = deviceFilter.value;
  const oem = oemFilter.value;
  const rarity = rarityFilter.value;

  filtered = data.filter(item => {
    const text = [
      item.location,
      item.device,
      item.oem,
      item.rarity,
      ...(item.tags || [])
    ].join(" ").toLowerCase();

    const textMatch = !q || text.includes(q);
    const locMatch = !loc || item.location === loc;
    const devMatch = !dev || item.device === dev;
    const oemMatch = !oem || item.oem === oem;
    const rarityMatch = !rarity || item.rarity === rarity;

    return textMatch && locMatch && devMatch && oemMatch && rarityMatch;
  });

  applySort();
}

// ===== SORT =====
function applySort() {
  const v = sort.value;

  if (v === "newest")
    filtered.sort((a, b) => b.date.localeCompare(a.date));
  else if (v === "oldest")
    filtered.sort((a, b) => a.date.localeCompare(b.date));
  else if (v === "az")
    filtered.sort((a, b) => a.location.localeCompare(b.location));
  else if (v === "za")
    filtered.sort((a, b) => b.location.localeCompare(a.location));

  render(filtered);
}

// ===== MODAL =====
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalMeta = document.getElementById("modal-meta");
const closeBtn = document.querySelector(".close");

function openModal(item) {
  modalImg.src = item.src;
  modalMeta.innerHTML = `
    <p>${item.date || ""}</p>
    <p>${item.location || ""}</p>
    <p>${item.device || ""}</p>
    <p>${item.oem || ""}</p>
    <p>${item.rarity || ""}</p>
    <p>${(item.tags || []).join(", ")}</p>
  `;
  modal.classList.add("open");
}

closeBtn.addEventListener("click", () => modal.classList.remove("open"));
modal.addEventListener("click", e => {
  if (e.target === modal) modal.classList.remove("open");
});

// ===== EVENTS =====
search.addEventListener("input", applyFilters);
locationFilter.addEventListener("change", applyFilters);
deviceFilter.addEventListener("change", applyFilters);
oemFilter.addEventListener("change", applyFilters);
rarityFilter.addEventListener("change", applyFilters);
sort.addEventListener("change", applySort);
