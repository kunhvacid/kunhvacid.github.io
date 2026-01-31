/* =========================
   GALLERY – RESPONSIVE PAGINATION + STATUS + CONTROLS (FIXED)
========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ========= ELEMENTS ========= */
  const gallery        = document.getElementById("gallery");
  const pagination     = document.getElementById("pagination");

  const search         = document.getElementById("search");
  const sort           = document.getElementById("sort");

  const locationFilter = document.getElementById("locationFilter");
  const deviceFilter   = document.getElementById("deviceFilter");
  const brandFilter    = document.getElementById("brandFilter");
  const oemFilter      = document.getElementById("oemFilter");
  const rarityFilter   = document.getElementById("rarityFilter");
  const unitFilter     = document.getElementById("unitFilter");

  const perPageSelect  = document.getElementById("perPage");
  const gotoInput      = document.getElementById("gotoPage");
  const pageStatus     = document.getElementById("pageStatus");
  const photoStatus    = document.getElementById("photoStatus");

  const modal          = document.getElementById("modal");
  const modalImg       = document.getElementById("modal-img");
  const modalMeta      = document.getElementById("modal-meta");
  const modalClose     = modal.querySelector(".close");
  const nextBtn        = modal.querySelector(".next");
  const prevBtn        = modal.querySelector(".prev");

  /* ========= STATE ========= */
  let data = [];
  let filtered = [];

  let currentIndex = 0;
  let currentPage = 1;
  let PER_PAGE = perPageSelect ? Number(perPageSelect.value) || 8 : 8;

  const PAGE_WINDOW = 10;
  let pageWindowStart = 1;

  /* ========= HELPERS ========= */
  const unique = arr => [...new Set(arr.filter(Boolean))].sort();
  const toArray = v => Array.isArray(v) ? v : (v ? [v] : []);

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
      render();
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

    render();
  }

  /* ========= RENDER ========= */
  function render() {
    if (!gallery) return;

    gallery.innerHTML = "";

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * PER_PAGE;
    const end   = Math.min(start + PER_PAGE, total);
    const pageItems = filtered.slice(start, end);

    pageItems.forEach(item => {
      const index = data.indexOf(item);

      const card = document.createElement("div");
      card.className = "gallery-card";

      const img = document.createElement("img");
      img.src = item.src;
      img.loading = "lazy";
      img.alt = item.brandArr.join(", ");
      img.onclick = () => openModal(index);

      card.appendChild(img);
      gallery.appendChild(card);
    });

    updateStatus(start + 1, end, total, totalPages);
    renderPagination(totalPages);
  }

  /* ========= STATUS ========= */
  function updateStatus(from, to, total, totalPages) {
    if (pageStatus)
      pageStatus.textContent =
        `Pages ${pageWindowStart}-${Math.min(pageWindowStart + PAGE_WINDOW - 1, totalPages)} of ${totalPages}`;

    if (photoStatus)
      photoStatus.textContent =
        total === 0 ? "No photos" : `Photos ${from}-${to} of ${total}`;
  }

  /* ========= PAGINATION ========= */
  function renderPagination(totalPages) {
    if (!pagination) return;

    pagination.innerHTML = "";

    const windowEnd = Math.min(pageWindowStart + PAGE_WINDOW - 1, totalPages);

    if (pageWindowStart > 1) {
      const prev = document.createElement("button");
      prev.textContent = "«";
      prev.onclick = () => {
        pageWindowStart -= PAGE_WINDOW;
        currentPage = pageWindowStart;
        render();
      };
      pagination.appendChild(prev);
    }

    for (let p = pageWindowStart; p <= windowEnd; p++) {
      const btn = document.createElement("button");
      btn.textContent = p;
      btn.className = p === currentPage ? "active" : "";
      btn.onclick = () => {
        currentPage = p;
        render();
      };
      pagination.appendChild(btn);
    }

    if (windowEnd < totalPages) {
      const next = document.createElement("button");
      next.textContent = "»";
      next.onclick = () => {
        pageWindowStart += PAGE_WINDOW;
        currentPage = pageWindowStart;
        render();
      };
      pagination.appendChild(next);
    }
  }

  /* ========= MODAL ========= */
  function openModal(index) {
    currentIndex = index;
    const item = data[index];

    modalImg.src = item.src;
    modalMeta.innerHTML = `
      <p><b>Brand:</b> ${item.brandArr.join(", ")}</p>
      <p><b>OEM:</b> ${item.oemArr.join(", ")}</p>
      <p><b>Rarity:</b> ${item.rarityArr.join(", ")}</p>
      <p><b>Units:</b> ${item.units}</p>
      <p><b>Location:</b> ${item.location}</p>
      <p><b>Device:</b> ${item.device}</p>
    `;

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

  nextBtn.onclick = () => openModal((currentIndex + 1) % data.length);
  prevBtn.onclick = () => openModal((currentIndex - 1 + data.length) % data.length);

  /* ========= CONTROLS ========= */
  if (perPageSelect)
    perPageSelect.onchange = () => {
      PER_PAGE = Number(perPageSelect.value);
      currentPage = 1;
      pageWindowStart = 1;
      render();
    };

  if (gotoInput)
    gotoInput.onchange = () => {
      const p = Number(gotoInput.value);
      const max = Math.ceil(filtered.length / PER_PAGE);
      if (p >= 1 && p <= max) {
        currentPage = p;
        pageWindowStart = Math.floor((p - 1) / PAGE_WINDOW) * PAGE_WINDOW + 1;
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
  sort.addEventListener("change", render);

});
