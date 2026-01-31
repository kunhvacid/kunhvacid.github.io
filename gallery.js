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
  const unitFilter     = document.getElementById("unitFilter");

  const perPageSelect = document.getElementById("perPage");
  const gotoInput     = document.getElementById("gotoPage");
  const pageStatus    = document.getElementById("pageStatus");
  const photoStatus   = document.getElementById("photoStatus");

  const modal      = document.getElementById("modal");
  const modalImg   = document.getElementById("modal-img");
  const modalMeta  = document.getElementById("modal-meta");
  const closeBtn   = modal.querySelector(".close");
  const nextBtn    = modal.querySelector(".next");
  const prevBtn    = modal.querySelector(".prev");

  /* ========= STATE ========= */
  let data = [];
  let filtered = [];
  let currentIndex = 0;

  let PER_PAGE = 8;
  let currentPage = 1;
  const PAGE_WINDOW = 10;
  let windowStart = 1;

  /* ========= HELPERS ========= */
  const toArray = v => Array.isArray(v) ? v : (v ? [v] : []);
  const unique = arr => [...new Set(arr.filter(Boolean))].sort();

  function normalize(item) {
    const brandArr  = toArray(item.brand);
    const rarityArr = toArray(item.rarity);
    const oemArr    = toArray(item.oem);

    const unitCount = Math.max(brandArr.length, rarityArr.length);

    return {
      ...item,
      brandArr,
      rarityArr,
      oemArr,
      unitCount,
      units: unitCount > 1 ? "Multiple" : "Single"
    };
  }

  /* ========= LOAD ========= */
  fetch("gallery/gallery.json")
    .then(r => r.json())
    .then(json => {
      data = json.map(normalize);
      filtered = [...data];
      populateFilters();
      render();
    });

  function populateFilters() {
    fill(brandFilter, unique(data.flatMap(i => i.brandArr)));
    fill(oemFilter, unique(data.flatMap(i => i.oemArr)));
    fill(rarityFilter, unique(data.flatMap(i => i.rarityArr)));
    fill(locationFilter, unique(data.map(i => i.location)));
    fill(deviceFilter, unique(data.map(i => i.device)));
    fill(unitFilter, ["Single", "Multiple"]);
  }

  function fill(select, values) {
    select.innerHTML = `<option value="">All</option>`;
    values.forEach(v => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      select.appendChild(o);
    });
  }

  /* ========= FILTER + SORT ========= */
  function applyFilters() {
    const q = search.value.toLowerCase();
    currentPage = 1;
    windowStart = 1;

    filtered = data.filter(i => {
      if (brandFilter.value && !i.brandArr.includes(brandFilter.value)) return false;
      if (rarityFilter.value && !i.rarityArr.includes(rarityFilter.value)) return false;
      if (oemFilter.value && !i.oemArr.includes(oemFilter.value)) return false;
      if (locationFilter.value && i.location !== locationFilter.value) return false;
      if (deviceFilter.value && i.device !== deviceFilter.value) return false;
      if (unitFilter.value && i.units !== unitFilter.value) return false;

      const text = [
        ...i.brandArr,
        ...i.rarityArr,
        ...i.oemArr,
        i.location,
        i.device,
        ...(i.tags || [])
      ].join(" ").toLowerCase();

      return !q || text.includes(q);
    });

    applySort();
  }

  function applySort() {
    const v = sort.value;

    if (v === "newest") filtered.sort((a,b)=>b.date.localeCompare(a.date));
    if (v === "oldest") filtered.sort((a,b)=>a.date.localeCompare(b.date));
    if (v === "az") filtered.sort((a,b)=>a.brandArr[0].localeCompare(b.brandArr[0]));
    if (v === "za") filtered.sort((a,b)=>b.brandArr[0].localeCompare(a.brandArr[0]));
    if (v === "units") filtered.sort((a,b)=>b.unitCount - a.unitCount);

    render();
  }

  /* ========= RENDER ========= */
  function render() {
    gallery.innerHTML = "";

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * PER_PAGE;
    const end = Math.min(start + PER_PAGE, total);

    filtered.slice(start, end).forEach(item => {
      const card = document.createElement("div");
      card.className = "gallery-card";

      const img = document.createElement("img");
      img.src = item.src;
      img.onclick = () => openModal(data.indexOf(item));

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

    updateStatus(start + 1, end, total, totalPages);
    renderPagination(totalPages);
  }

  function updateStatus(from, to, total, pages) {
    pageStatus.textContent =
      `Pages ${windowStart}-${Math.min(windowStart + PAGE_WINDOW - 1, pages)} of ${pages}`;
    photoStatus.textContent =
      total ? `Photos ${from}-${to} of ${total}` : "No photos";
  }

  function renderPagination(totalPages) {
    pagination.innerHTML = "";
    const end = Math.min(windowStart + PAGE_WINDOW - 1, totalPages);

    if (windowStart > 1) {
      const prev = document.createElement("button");
      prev.textContent = "«";
      prev.onclick = () => { windowStart -= PAGE_WINDOW; currentPage = windowStart; render(); };
      pagination.appendChild(prev);
    }

    for (let i = windowStart; i <= end; i++) {
      const b = document.createElement("button");
      b.textContent = i;
      b.className = i === currentPage ? "active" : "";
      b.onclick = () => { currentPage = i; render(); };
      pagination.appendChild(b);
    }

    if (end < totalPages) {
      const next = document.createElement("button");
      next.textContent = "»";
      next.onclick = () => { windowStart += PAGE_WINDOW; currentPage = windowStart; render(); };
      pagination.appendChild(next);
    }
  }

  /* ========= MODAL ========= */
  function openModal(i) {
    currentIndex = i;
    const item = data[i];
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

  closeBtn.onclick = () => { modal.classList.remove("open"); document.body.style.overflow = ""; };
  modal.onclick = e => e.target === modal && closeBtn.onclick();

  nextBtn.onclick = () => openModal((currentIndex + 1) % data.length);
  prevBtn.onclick = () => openModal((currentIndex - 1 + data.length) % data.length);

  /* ========= EVENTS ========= */
  search.oninput = applyFilters;
  [brandFilter, oemFilter, rarityFilter, locationFilter, deviceFilter, unitFilter].forEach(f =>
    f.onchange = applyFilters
  );
  sort.onchange = applySort;

  perPageSelect.onchange = () => {
    PER_PAGE = parseInt(perPageSelect.value, 10);
    currentPage = 1;
    windowStart = 1;
    render();
  };

  gotoInput.onchange = () => {
    const n = parseInt(gotoInput.value, 10);
    const pages = Math.ceil(filtered.length / PER_PAGE);
    if (n >= 1 && n <= pages) {
      currentPage = n;
      windowStart = Math.floor((n - 1) / PAGE_WINDOW) * PAGE_WINDOW + 1;
      render();
    }
  };

});
