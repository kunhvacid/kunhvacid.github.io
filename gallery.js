/* =========================
   GALLERY – CLEAN, FIXED VERSION
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ELEMENTS */
  const gallery = document.getElementById("gallery");
  const search = document.getElementById("search");
  const sort = document.getElementById("sort");

  const locationFilter = document.getElementById("locationFilter");
  const deviceFilter = document.getElementById("deviceFilter");
  const brandFilter = document.getElementById("brandFilter");
  const oemFilter = document.getElementById("oemFilter");
  const rarityFilter = document.getElementById("rarityFilter");

  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  const modalMeta = document.getElementById("modal-meta");
  const modalClose = document.querySelector(".close");

  let data = [];
  let filtered = [];

  /* LOAD DATA */
  fetch("gallery/gallery.json")
    .then(r => r.json())
    .then(json => {
      data = json;
      populateFilters();
      filtered = [...data];   // NO filtering on load
      applySort();
    })
    .catch(err => console.error("Gallery load failed:", err));

  /* HELPERS */
  function unique(values) {
    return [...new Set(values.filter(Boolean))].sort();
  }

  function fill(select, values) {
    select.innerHTML = `<option value="">All</option>`;
    values.forEach(v => {
      const o = document.createElement("option");
      o.value = v;           // IMPORTANT: raw value
      o.textContent = v;
      select.appendChild(o);
    });
  }

  /* POPULATE FILTERS */
  function populateFilters() {
    fill(brandFilter, unique(data.map(i => i.brand)));
    fill(oemFilter, unique(data.map(i => i.oem)));
    fill(rarityFilter, unique(data.map(i => i.rarity)));
    fill(locationFilter, unique(data.map(i => i.location)));
    fill(deviceFilter, unique(data.map(i => i.device)));
  }

  /* FILTERING */
  function applyFilters() {
    const q = search.value.trim().toLowerCase();

    filtered = data.filter(i => {
      const searchableText = [
        i.brand,
        i.oem,
        i.rarity,
        i.location,
        i.device,
        ...(i.tags || [])
      ].join(" ").toLowerCase();

      if (q && !searchableText.includes(q)) return false;
      if (brandFilter.value && i.brand !== brandFilter.value) return false;
      if (oemFilter.value && i.oem !== oemFilter.value) return false;
      if (rarityFilter.value && i.rarity !== rarityFilter.value) return false;
      if (locationFilter.value && i.location !== locationFilter.value) return false;
      if (deviceFilter.value && i.device !== deviceFilter.value) return false;

      return true;
    });

    applySort();
  }

  /* SORTING */
  function applySort() {
    const v = sort.value;

    if (v === "newest") {
      filtered.sort((a, b) => b.date.localeCompare(a.date));
    }
    if (v === "oldest") {
      filtered.sort((a, b) => a.date.localeCompare(b.date));
    }
    if (v === "az") {
      filtered.sort((a, b) => a.brand.localeCompare(b.brand));
    }
    if (v === "za") {
      filtered.sort((a, b) => b.brand.localeCompare(a.brand));
    }

    render();
  }

  /* RENDER */
  function render() {
    gallery.innerHTML = "";

    filtered.forEach(item => {
      const card = document.createElement("div");
      card.className = "gallery-card";

      const img = document.createElement("img");
      img.src = item.src;
      img.loading = "lazy";
      img.alt = item.brand;

      img.addEventListener("click", () => openModal(item));

      const overlay = document.createElement("div");
      overlay.className = "overlay";
      overlay.innerHTML = `
        <strong>${item.brand}</strong><br>
        ${item.location}<br>
        ${item.date}
      `;

      card.append(img, overlay);
      gallery.appendChild(card);
    });
  }

  /* MODAL */
  function openModal(item) {
    modalImg.src = item.src;
    modalMeta.innerHTML = `
      <p><b>Brand:</b> ${item.brand}</p>
      <p><b>OEM:</b> ${item.oem}</p>
      <p><b>Rarity:</b> ${item.rarity}</p>
      <p><b>Location:</b> ${item.location}</p>
      <p><b>Device:</b> ${item.device}</p>
      <p><b>Tags:</b> ${item.tags.join(", ")}</p>
    `;
    modal.classList.add("open");
  }

  modalClose.addEventListener("click", () => {
    modal.classList.remove("open");
  });

  modal.addEventListener("click", e => {
    if (e.target === modal) modal.classList.remove("open");
  });

  /* EVENTS */
  search.addEventListener("input", applyFilters);
  brandFilter.addEventListener("change", applyFilters);
  oemFilter.addEventListener("change", applyFilters);
  rarityFilter.addEventListener("change", applyFilters);
  locationFilter.addEventListener("change", applyFilters);
  deviceFilter.addEventListener("change", applyFilters);
  sort.addEventListener("change", applySort);
});
