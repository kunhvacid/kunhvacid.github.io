/* =========================
   GALLERY – FULL REPLACEMENT
   Multi-brand + single/multiple units + modal nav + zoom
   ========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ========= ELEMENTS ========= */
  const gallery = document.getElementById("gallery");
  const pagination = document.getElementById("pagination");

  const search = document.getElementById("search");
  const sort = document.getElementById("sort");

  const locationFilter = document.getElementById("locationFilter");
  const deviceFilter   = document.getElementById("deviceFilter");
  const brandFilter    = document.getElementById("brandFilter");
  const oemFilter      = document.getElementById("oemFilter");
  const rarityFilter   = document.getElementById("rarityFilter");
  const unitFilter     = document.getElementById("unitFilter"); // NEW

  const modal      = document.getElementById("modal");
  const modalImg   = document.getElementById("modal-img");
  const modalMeta  = document.getElementById("modal-meta");
  const modalClose = modal.querySelector(".close");
  const nextBtn    = modal.querySelector(".next");
  const prevBtn    = modal.querySelector(".prev");

  /* ========= STATE ========= */
  let data = [];
  let filtered = [];
  let currentIndex = 0;
  let isZoomed = false;

  const PER_PAGE = 8;
  let currentPage = 1;

  /* ========= HELPERS ========= */
  const unique = arr => [...new Set(arr.filter(Boolean))].sort();

  const toArray = v => {
    if (Array.isArray(v)) return v;
    if (v === undefined || v === null) return [];
    return [v];
  };

  const isMultiple = item => toArray(item.brand).length > 1;

  function fill(select, values) {
    if (!select) return;
    select.innerHTML = `<option value="">All</option>`;
    values.forEach(v => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      select.appendChild(o);
    });
  }

  /* ========= LOAD DATA ========= */
  fetch("gallery/gallery.json")
    .then(r => r.json())
    .then(json => {
      data = json;
      filtered = [...data];
      populateFilters();
      applySort();
    })
    .catch(err => console.error("Gallery load failed:", err));

  /* ========= FILTER POPULATION ========= */
  function populateFilters() {
    fill(brandFilter,    unique(data.flatMap(i => toArray(i.brand))));
    fill(oemFilter,      unique(data.flatMap(i => toArray(i.oem))));
    fill(rarityFilter,   unique(data.flatMap(i => toArray(i.rarity))));
    fill(locationFilter, unique(data.map(i => i.location)));
    fill(deviceFilter,   unique(data.map(i => i.device)));

    if (unitFilter) {
      unitFilter.innerHTML = `
        <option value="">All</option>
        <option value="single">Single unit</option>
        <option value="multiple">Multiple units</option>
      `;
    }
  }

  /* ========= FILTER LOGIC ========= */
  function applyFilters() {
    const q = search.value.toLowerCase().trim();
    currentPage = 1;

    filtered = data.filter(i => {
      const brands  = toArray(i.brand);
      const oems    = toArray(i.oem);
      const rar     = toArray(i.rarity);

      const text = [
        ...brands, ...oems, ...rar,
        i.location, i.device,
        ...(i.tags || [])
      ].join(" ").toLowerCase();

      if (q && !text.includes(q)) return false;
      if (brandFilter.value    && !brands.includes(brandFilter.value)) return false;
      if (oemFilter.value      && !oems.includes(oemFilter.value)) return false;
      if (rarityFilter.value   && !rar.includes(rarityFilter.value)) return false;
      if (locationFilter.value && i.location !== locationFilter.value) return false;
      if (deviceFilter.value   && i.device   !== deviceFilter.value) return false;

      if (unitFilter?.value === "single"   && isMultiple(i)) return false;
      if (unitFilter?.value === "multiple" && !isMultiple(i)) return false;

      return true;
    });

    applySort();
  }

  /* ========= SORT ========= */
  function applySort() {
    const v = sort.value;

    if (v === "newest") filtered.sort((a,b)=>b.date.localeCompare(a.date));
    if (v === "oldest") filtered.sort((a,b)=>a.date.localeCompare(b.date));
    if (v === "az") filtered.sort((a,b)=>toArray(a.brand)[0].localeCompare(toArray(b.brand)[0]));
    if (v === "za") filtered.sort((a,b)=>toArray(b.brand)[0].localeCompare(toArray(a.brand)[0]));

    render();
  }

  /* ========= RENDER ========= */
  function render() {
    gallery.innerHTML = "";

    const start = (currentPage - 1) * PER_PAGE;
    const pageItems = filtered.slice(start, start + PER_PAGE);

    pageItems.forEach(item => {
      const index = data.indexOf(item);

      const card = document.createElement("div");
      card.className = "gallery-card";

      const img = document.createElement("img");
      img.src = item.src;
      img.alt = toArray(item.brand).join(", ");
      img.loading = "lazy";
      img.addEventListener("click", () => openModal(index));

      const overlay = document.createElement("div");
      overlay.className = "overlay";
      overlay.innerHTML = `
        <strong>${toArray(item.brand).join(", ")}</strong><br>
        ${item.location}<br>
        ${item.date}
      `;

      if (isMultiple(item)) {
        const badge = document.createElement("span");
        badge.className = "badge-multi";
        badge.textContent = "Multiple units";
        card.appendChild(badge);
      }

      card.append(img, overlay);
      gallery.appendChild(card);
    });

    renderPagination();
  }

  function renderPagination() {
    pagination.innerHTML = "";
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = i === currentPage ? "active" : "";
      btn.onclick = () => {
        currentPage = i;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      pagination.appendChild(btn);
    }
  }

  /* ========= MODAL ========= */
  function openModal(index) {
    currentIndex = index;
    const item = data[index];

    modalImg.src = item.src;
    modalMeta.innerHTML = `
      <div class="info-grid">
        <p><b>Brand:</b> ${toArray(item.brand).join(", ")}</p>
        <p><b>OEM:</b> ${toArray(item.oem).join(", ")}</p>
        <p><b>Rarity:</b> ${toArray(item.rarity).join(", ")}</p>
        <p><b>Location:</b> ${item.location}</p>
        <p><b>Device:</b> ${item.device}</p>
        <p>${(item.tags || []).join(", ")}</p>
      </div>
    `;

    isZoomed = false;
    modalImg.classList.remove("zoomed");
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("open");
    modalImg.src = "";
    document.body.style.overflow = "";
  }

  modalClose.onclick = closeModal;
  modal.onclick = e => { if (e.target === modal) closeModal(); };

  /* ========= ZOOM ========= */
  modalImg.addEventListener("click", e => {
    e.stopPropagation();
    isZoomed = !isZoomed;
    modalImg.classList.toggle("zoomed", isZoomed);
  });

  /* ========= NAV ========= */
  nextBtn.onclick = e => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % data.length;
    openModal(currentIndex);
  };

  prevBtn.onclick = e => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + data.length) % data.length;
    openModal(currentIndex);
  };

  /* ========= SWIPE ========= */
  let startX = 0;
  modal.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  modal.addEventListener("touchend", e => {
    const diff = e.changedTouches[0].clientX - startX;
    if (diff > 60) prevBtn.click();
    if (diff < -60) nextBtn.click();
  });

  /* ========= EVENTS ========= */
  search.addEventListener("input", applyFilters);
  brandFilter.addEventListener("change", applyFilters);
  oemFilter.addEventListener("change", applyFilters);
  rarityFilter.addEventListener("change", applyFilters);
  locationFilter.addEventListener("change", applyFilters);
  deviceFilter.addEventListener("change", applyFilters);
  unitFilter?.addEventListener("change", applyFilters);
  sort.addEventListener("change", applySort);

});
