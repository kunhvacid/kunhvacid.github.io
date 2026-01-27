/* =========================
   GALLERY – PAGINATED + FIXED MODAL
   ========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ELEMENTS */
  const gallery = document.getElementById("gallery");
  const pagination = document.getElementById("pagination");

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

  /* STATE */
  let data = [];
  let filtered = [];

  const PER_PAGE = 8;
  let currentPage = 1;

  /* LOAD DATA */
  fetch("gallery/gallery.json")
    .then(r => r.json())
    .then(json => {
      data = json;
      populateFilters();
      filtered = [...data];
      applySort();
    })
    .catch(err => console.error("Gallery load failed:", err));

  /* HELPERS */
  const unique = arr => [...new Set(arr.filter(Boolean))].sort();

  function fill(select, values) {
    select.innerHTML = `<option value="">All</option>`;
    values.forEach(v => {
      const o = document.createElement("option");
      o.value = v;
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
    currentPage = 1; // RESET PAGE

    filtered = data.filter(i => {
      const text = [
        i.brand,
        i.oem,
        i.rarity,
        i.location,
        i.device,
        ...(i.tags || [])
      ].join(" ").toLowerCase();

      if (q && !text.includes(q)) return false;
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

    if (v === "newest") filtered.sort((a,b)=>b.date.localeCompare(a.date));
    if (v === "oldest") filtered.sort((a,b)=>a.date.localeCompare(b.date));
    if (v === "az") filtered.sort((a,b)=>a.brand.localeCompare(b.brand));
    if (v === "za") filtered.sort((a,b)=>b.brand.localeCompare(a.brand));

    render();
  }

  /* RENDER (PAGINATED) */
  function render() {
    gallery.innerHTML = "";

    const start = (currentPage - 1) * PER_PAGE;
    const end = start + PER_PAGE;
    const pageItems = filtered.slice(start, end);

    pageItems.forEach(item => {
      const card = document.createElement("div");
      card.className = "gallery-card";

      const img = document.createElement("img");
      img.src = item.src;
      img.loading = "lazy";
      img.alt = item.brand;

      // FIXED CLICK HANDLER
      img.addEventListener("click", e => {
        e.stopPropagation();
        openModal(item);
      });

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

    renderPagination();
  }

  /* PAGINATION */
  function renderPagination() {
    pagination.innerHTML = "";

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = i === currentPage ? "active" : "";

      btn.addEventListener("click", () => {
        currentPage = i;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      pagination.appendChild(btn);
    }
  }

  /* MODAL (CLICK-TO-ZOOM FIXED) */
  function openModal(item) {
    modalImg.src = item.src;
    modalMeta.innerHTML = `
      <p><b>Brand:</b> ${item.brand}</p>
      <p><b>OEM:</b> ${item.oem}</p>
      <p><b>Rarity:</b> ${item.rarity}</p>
      <p><b>Location:</b> ${item.location}</p>
      <p><b>Device:</b> ${item.device}</p>
      <p>${item.tags.join(", ")}</p>
    `;
    modal.classList.add("open");
  }

  modalClose.addEventListener("click", closeModal);

  modal.addEventListener("click", e => {
    if (e.target === modal) closeModal();
  });

  function closeModal() {
    modal.classList.remove("open");
    modalImg.src = "";
  }

  /* EVENTS */
  search.addEventListener("input", applyFilters);
  brandFilter.addEventListener("change", applyFilters);
  oemFilter.addEventListener("change", applyFilters);
  rarityFilter.addEventListener("change", applyFilters);
  locationFilter.addEventListener("change", applyFilters);
  deviceFilter.addEventListener("change", applyFilters);
  sort.addEventListener("change", applySort);
});

