const gallery = document.getElementById("gallery");
const search = document.getElementById("search");
const sort = document.getElementById("sort");

const locationFilter = document.getElementById("locationFilter");
const deviceFilter = document.getElementById("deviceFilter");
const brandFilter = document.getElementById("brandFilter");
const oemFilter = document.getElementById("oemFilter");
const rarityFilter = document.getElementById("rarityFilter");

let data = [];
let filtered = [];

fetch("gallery/gallery.json")
  .then(r => r.json())
  .then(json => {
    data = json;
    populateFilters();
    applyFilters();
  });

function unique(arr) {
  return [...new Set(arr)].sort();
}

function populateFilters() {
  fill(brandFilter, unique(data.map(i => i.brand)));
  fill(oemFilter, unique(data.map(i => i.oem)));
  fill(locationFilter, unique(data.map(i => i.location)));
  fill(deviceFilter, unique(data.map(i => i.device)));
  fill(rarityFilter, unique(data.map(i => i.rarity)));
}


function fill(select, values) {
  select.innerHTML = `<option value="">All</option>`;
  values
    .filter(Boolean)
    .sort()
    .forEach(v => {
      const o = document.createElement("option");
      o.value = v.toLowerCase(); // normalized
      o.textContent = v;
      select.appendChild(o);
    });
}


function applyFilters() {
  const q = search.value.toLowerCase();

  filtered = data.filter(i => {
    const text = [
      i.brand,
      i.location,
      i.device,
      i.oem,
      i.rarity,
      ...i.tags
    ].join(" ").toLowerCase();

    if (q && !text.includes(q)) return false;
    if (locationFilter.value && i.location !== locationFilter.value) return false;
    if (deviceFilter.value && i.device !== deviceFilter.value) return false;
    if (brandFilter.value && i.brand.toLowerCase() !== brandFilter.value) return false;
    if (oemFilter.value && i.oem !== oemFilter.value) return false;
    if (rarityFilter.value && i.rarity !== rarityFilter.value) return false;

    return true;
  });

  applySort();
}


function applySort() {
  const v = sort.value;
  if (v === "newest") filtered.sort((a,b)=>b.date.localeCompare(a.date));
  if (v === "oldest") filtered.sort((a,b)=>a.date.localeCompare(b.date));
  if (v === "az") filtered.sort((a,b)=>a.location.localeCompare(b.location));
  if (v === "za") filtered.sort((a,b)=>b.location.localeCompare(a.location));
  render();
}

function render() {
  gallery.innerHTML = "";
  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "gallery-card";

    const img = document.createElement("img");
    img.src = item.src;
    img.loading = "lazy";
    img.onclick = () => openModal(item);

    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `
      <strong>${item.tags[0]}</strong><br>
      ${item.location}<br>
      ${item.device}<br>
      ${item.date}
    `;

    card.append(img, overlay);
    gallery.appendChild(card);
  });
}

/* MODAL (zoom in/out) */
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalMeta = document.getElementById("modal-meta");

function openModal(item) {
  modalImg.src = item.src;
  modalMeta.innerHTML = `
    <p><b>Brand:</b> ${item.tags[0]}</p>
    <p><b>OEM:</b> ${item.oem}</p>
    <p><b>Rarity:</b> ${item.rarity}</p>
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
brandFilter.addEventListener("change", applyFilters);
oemFilter.addEventListener("change", applyFilters);
rarityFilter.addEventListener("change", applyFilters);
sort.addEventListener("change", applySort);
