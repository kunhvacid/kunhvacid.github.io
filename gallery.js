const gallery = document.getElementById("gallery");
const search = document.getElementById("search");
const sort = document.getElementById("sort");
const locationFilter = document.getElementById("locationFilter");
const deviceFilter = document.getElementById("deviceFilter");

let data = [];
let filtered = [];

fetch("gallery/gallery.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    filtered = [...data];
    populateFilters();
    render(filtered);
  })
  .catch(err => console.error("Gallery load failed", err));

function populateFilters() {
  const locations = [...new Set(data.map(i => i.location))];
  const devices = [...new Set(data.map(i => i.device))];

  locations.forEach(l => {
    const o = document.createElement("option");
    o.value = l;
    o.textContent = l;
    locationFilter.appendChild(o);
  });

  devices.forEach(d => {
    const o = document.createElement("option");
    o.value = d;
    o.textContent = d;
    deviceFilter.appendChild(o);
  });
}

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
    ${item.date}<br>
    ${item.device}
  `;

  card.append(img, overlay);
  card.onclick = () => openModal(item);
  return card;
}

function render(items) {
  gallery.innerHTML = "";
  items.forEach(i => gallery.appendChild(createCard(i)));
}

function applyFilters() {
  const q = search.value.toLowerCase();
  const loc = locationFilter.value;
  const dev = deviceFilter.value;

  filtered = data.filter(i => {
    const tagMatch = i.tags?.join(" ").toLowerCase().includes(q);
    const locMatch = !loc || i.location === loc;
    const devMatch = !dev || i.device === dev;
    return tagMatch && locMatch && devMatch;
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

search.addEventListener("input", applyFilters);
locationFilter.addEventListener("change", applyFilters);
deviceFilter.addEventListener("change", applyFilters);
sort.addEventListener("change", applySort);




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
