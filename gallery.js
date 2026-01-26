






const gallery = document.getElementById("gallery");

const searchInput = document.getElementById("searchInput");
const locationFilter = document.getElementById("locationFilter");
const deviceFilter = document.getElementById("deviceFilter");
const oemFilter = document.getElementById("oemFilter");
const rarityFilter = document.getElementById("rarityFilter");
const sortFilter = document.getElementById("sortFilter");

const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImg");
const modalMeta = document.getElementById("modalMeta");

let data = [];
let filtered = [];

fetch("gallery/gallery.json")
  .then(r => r.json())
  .then(j => {
    data = j;
    populateFilters();
    applyFilters();
  });

function populateFilters() {
  const uniq = arr => [...new Set(arr)];

  uniq(data.map(i => i.location)).forEach(v =>
    locationFilter.add(new Option(v, v))
  );
  uniq(data.map(i => i.device)).forEach(v =>
    deviceFilter.add(new Option(v, v))
  );
  uniq(data.map(i => i.oem)).forEach(v =>
    oemFilter.add(new Option(v, v))
  );
  uniq(data.map(i => i.rarity)).forEach(v =>
    rarityFilter.add(new Option(v, v))
  );
}

function applyFilters() {
  const q = searchInput.value.toLowerCase();

  filtered = data.filter(i => {
    const text = [i.location, i.device, i.oem, i.rarity, ...i.tags].join(" ").toLowerCase();
    return (
      text.includes(q) &&
      (locationFilter.value === "all" || i.location === locationFilter.value) &&
      (deviceFilter.value === "all" || i.device === deviceFilter.value) &&
      (oemFilter.value === "all" || i.oem === oemFilter.value) &&
      (rarityFilter.value === "all" || i.rarity === rarityFilter.value)
    );
  });

  sortAndRender();
}

function sortAndRender() {
  const v = sortFilter.value;
  if (v === "newest") filtered.sort((a,b)=>b.date.localeCompare(a.date));
  if (v === "oldest") filtered.sort((a,b)=>a.date.localeCompare(b.date));
  if (v === "az") filtered.sort((a,b)=>a.location.localeCompare(b.location));
  if (v === "za") filtered.sort((a,b)=>b.location.localeCompare(a.location));
  render();
}

function render() {
  gallery.innerHTML = "";
  filtered.forEach(i => {
    const c = document.createElement("div");
    c.className = "gallery-card";

    c.innerHTML = `
      <img src="${i.src}" loading="lazy">
      <div class="overlay">
        <strong>${i.tags[0]}</strong><br>
        ${i.location}<br>
        ${i.date}<br>
        ${i.device}
      </div>
    `;

    c.onclick = () => openModal(i);
    gallery.appendChild(c);
  });
}

function openModal(i) {
  modalImg.src = i.src;
  modalMeta.innerHTML = `
    <p>${i.date}</p>
    <p>${i.location}</p>
    <p>${i.device}</p>
    <p>${i.oem} • ${i.rarity}</p>
    <p>${i.tags.join(", ")}</p>
  `;
  modal.classList.add("open");
}

document.querySelector(".close").onclick = () => modal.classList.remove("open");
modal.onclick = e => e.target === modal && modal.classList.remove("open");

searchInput.oninput =
locationFilter.onchange =
deviceFilter.onchange =
oemFilter.onchange =
rarityFilter.onchange =
sortFilter.onchange = applyFilters;
