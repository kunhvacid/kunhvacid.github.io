/* =========================
   GALLERY – RESPONSIVE PAGINATION + STATUS + CONTROLS
========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ========= ELEMENTS ========= */
  const gallery     = document.getElementById("gallery");
  const pagination  = document.getElementById("pagination");

  const search      = document.getElementById("search");
  const sort        = document.getElementById("sort");

  const locationFilter = document.getElementById("locationFilter");
  const deviceFilter   = document.getElementById("deviceFilter");
  const brandFilter    = document.getElementById("brandFilter");
  const oemFilter      = document.getElementById("oemFilter");
  const rarityFilter   = document.getElementById("rarityFilter");
  const unitFilter     = document.getElementById("unitFilter");

  const perPageSelect  = document.getElementById("perPage");     // select
  const gotoInput      = document.getElementById("gotoPage");    // input number
  const pageStatus     = document.getElementById("pageStatus");  // text
  const photoStatus    = document.getElementById("photoStatus"); // text

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

  let PER_PAGE = 8;
  let currentPage = 1;

  const PAGE_WINDOW = 10;
  let pageWindowStart = 1;

  /* ========= HELPERS ========= */
  const unique = arr => [...new Set(arr.filter(Boolean))].sort();
  const toArray = v => Array.isArray(v) ? v : (v ? [v] : []);

  function fill(select, values) {
    select.innerHTML = `<option value="">All</option>`;
    values.forEach(v => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      select.appendChild(o);
    });
  }

  function normalize(item) {
    const brandArr  = toArray(item.brand);
    const rarityArr = toArray(item.rarity);
    const oemArr    = toArray(item.oem);

    return {
      ...item,
      brandArr,
      rarityArr,
      oemArr,
      units: brandArr.length > 1 || rarityArr.length > 1 ? "Multiple" : "Single"
    };
  }

  /* ========= LOAD DATA ========= */
  fetch("gallery/gallery.json")
    .then(r => r.json())
    .then(json => {
      data = json.map(normalize);
      filtered = [...data];
      populateFilters();
      applySort();
    });

  /* ========= FILTER POPULATION ========= */
  function populateFilters() {
    fill(brandFilter,    unique(data.flatMap(i => i.brandArr)));
    fill(oemFilter,      unique(data.flatMap(i => i.oemArr)));
    fill(rarityFilter,   unique(data.flatMap(i => i.rarityArr)));
    fill(locationFilter, unique(data.map(i => i.location)));
    fill(deviceFilter,   unique(data.map(i => i.device)));
    fill(unitFilter, ["Single", "Multiple"]);
  }

  /* ========= FILTERING ========= */
  function applyFilters() {
    const q = search.value.toLowerCase().trim();
    currentPage = 1;
    pageWindowStart = 1;

    filtered = data.filter(i => {
      const text = [
        ...i.brandArr,
        ...i.rarityArr,
        ...i.oemArr,
        i.location,
        i.device,
        ...(i.tags || [])
      ].join(" ").toLowerCase();

      if (q && !text.includes(q)) return false;
      if (brandFilter.value    && !i.brandArr.includes(brandFilter.value)) return false;
      if (rarityFilter.value   && !i.rarityArr.includes(rarityFilter.value)) return false;
      if (oemFilter.value      && !i.oemArr.includes(oemFilter.value)) return false;
      if (locationFilter.value && i.location !== locationFilter.value) return false;
      if (deviceFilter.value   && i.device !== deviceFilter.value) return false;
      if (unitFilter.value     && i.units !== unitFilter.value) return false;

      return true;
    });

    applySort();
  }

  /* ========= SORT ========= */
  function applySort() {
    const v = sort.value;

    if (v === "newest") filtered.sort((a,b)=>b.date.localeCompare(a.date));
    if (v === "oldest") filtered.sort((a,b)=>a.date.localeCompare(b.date));
    if (v === "az")     filtered.sort((a,b)=>a.brandArr[0].localeCompare(b.brandArr[0]));
    if (v === "za")     filtered.sort((a,b)=>b.brandArr[0].localeCompare(a.brandArr[0]));

    render();
  }

  /* ========= RENDER ========= */
  function render() {
    gallery.innerHTML = "";

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    currentPage = Math.min(currentPage, totalPages);

    const startIndex = (currentPage - 1) * PER_PAGE;
    const endIndex   = Math.min(startIndex + PER_PAGE, total);
    const pageItems  = filtered.slice(startIndex, endIndex);

    pageItems.forEach(item => {
      const index = data.indexOf(item);

      const card = document.createElement("div");
      card.className = "gallery-card";

      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.brandArr.join(", ");
      img.loading = "lazy";
      img.onclick = () => openModal(index);

      const overlay = document.createElement("div");
      overlay.className = "overlay";
      overlay.innerHTML = `
        <strong>${item.brandArr.join(", ")}</strong><br>
        ${item.location}<br>
        ${item.date}
      `;

      if (item.units === "Multiple") {
        const badge = document.createElement("div");
        badge.className = "unit-badge";
        badge.textContent = "Multiple units";
        card.appendChild(badge);
      }

      card.append(img, overlay);
      gallery.appendChild(card);
    });

    updateStatus(startIndex + 1, endIndex, total, totalPages);
    renderPagination(totalPages);
  }

  /* ========= STATUS ========= */
  function updateStatus(from, to, total, totalPages) {
    pageStatus.textContent  =
      `Page ${pageWindowStart}-${Math.min(pageWindowStart + PAGE_WINDOW - 1, totalPages)} of ${totalPages}`;

    photoStatus.textContent =
      total === 0 ? "No photos" : `Photos ${from}-${to} of ${total}`;
  }

  /* ========= PAGINATION ========= */
  function renderPagination(totalPages) {
    pagination.innerHTML = "";

    const windowEnd = Math.min(pageWindowStart + PAGE_WINDOW - 1, totalPages);

    if (pageWindowStart > 1) {
      const prevSet = document.createElement("button");
      prevSet.textContent = "«";
      prevSet.onclick = () => {
        pageWindowStart = Math.max(1, pageWindowStart - PAGE_WINDOW);
        currentPage = pageWindowStart;
        render();
      };
      pagination.appendChild(prevSet);
    }

    for (let p = pageWindowStart; p <= windowEnd; p++) {
      const btn = document.createElement("button");
      btn.textContent = p;
      btn.className = p === currentPage ? "active" : "";
      btn.onclick = () => {
        currentPage = p;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      pagination.appendChild(btn);
    }

    if (windowEnd < totalPages) {
      const nextSet = document.createElement("button");
      nextSet.textContent = "»";
      nextSet.onclick = () => {
        pageWindowStart = pageWindowStart + PAGE_WINDOW;
        currentPage = pageWindowStart;
        render();
      };
      pagination.appendChild(nextSet);
    }
  }

  /* ========= MODAL ========= */
  function openModal(index) {
    currentIndex = index;
    const item = data[index];

    modalImg.src = item.src;
    modalMeta.innerHTML = `
      <div class="info-grid">
        <p><b>Brand:</b> ${item.brandArr.join(", ")}</p>
        <p><b>OEM:</b> ${item.oemArr.join(", ")}</p>
        <p><b>Rarity:</b> ${item.rarityArr.join(", ")}</p>
        <p><b>Units:</b> ${item.units}</p>
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

  modalImg.onclick = e => {
    e.stopPropagation();
    isZoomed = !isZoomed;
    modalImg.classList.toggle("zoomed", isZoomed);
  };

  nextBtn.onclick = () => openModal((currentIndex + 1) % data.length);
  prevBtn.onclick = () => openModal((currentIndex - 1 + data.length) % data.length);

  /* ========= CONTROLS ========= */
  perPageSelect.onchange = () => {
    PER_PAGE = parseInt(perPageSelect.value, 10);
    currentPage = 1;
    pageWindowStart = 1;
    render();
  };

  gotoInput.onchange = () => {
    const n = parseInt(gotoInput.value, 10);
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    if (n >= 1 && n <= totalPages) {
      currentPage = n;
      pageWindowStart = Math.floor((n - 1) / PAGE_WINDOW) * PAGE_WINDOW + 1;
      render();
    }
  };

  /* ========= EVENTS ========= */
  search.addEventListener("input", applyFilters);
  brandFilter.addEventListener("change", applyFilters);
  oemFilter.addEventListener("change", applyFilters);
  rarityFilter.addEventListener("change", applyFilters);
  locationFilter.addEventListener("change", applyFilters);
  deviceFilter.addEventListener("change", applyFilters);
  unitFilter.addEventListener("change", applyFilters);
  sort.addEventListener("change", applySort);

});
