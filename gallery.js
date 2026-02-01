document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     ELEMENTS
  ========================= */

  const gallery = document.getElementById("gallery");
  const pagination = document.getElementById("pagination");

  const search = document.getElementById("search");
  const sort = document.getElementById("sort");

  const brandFilter    = document.getElementById("brandFilter");
  const oemFilter      = document.getElementById("oemFilter");
  const rarityFilter   = document.getElementById("rarityFilter");
  const locationFilter = document.getElementById("locationFilter");
  const deviceFilter   = document.getElementById("deviceFilter");
  const unitFilter     = document.getElementById("unitFilter");

  const perPageSelect = document.getElementById("perPage");
  const gotoInput     = document.getElementById("gotoPage");
  const pageStatus    = document.getElementById("pageStatus");
  const photoStatus   = document.getElementById("photoStatus");

  const modal     = document.getElementById("modal");
  const modalImg  = document.getElementById("modal-img");
  const modalMeta = document.getElementById("modal-meta");
  const closeBtn  = modal.querySelector(".close");
  const nextBtn   = modal.querySelector(".next");
  const prevBtn   = modal.querySelector(".prev");

  /* =========================
     STATE
  ========================= */

  let data = [];
  let filtered = [];
  let currentIndex = 0;

  let PER_PAGE = 4;
  let currentPage = 1;

  const PAGE_WINDOW = 10;
  let windowStart = 1;

  let observer;

  /* =========================
     HELPERS
  ========================= */

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

  function fill(select, values) {
    select.innerHTML = `<option value="">All</option>`;
    values.forEach(v => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      select.appendChild(o);
    });
  }

  /* =========================
     LOAD DATA
  ========================= */

  fetch("gallery/gallery.json")
    .then(r => r.json())
    .then(json => {
      data = json.map(normalize);
      filtered = [...data];
      populateFilters();
      applySort();
    });

  function populateFilters() {
    fill(brandFilter, unique(data.flatMap(i => i.brandArr)));
    fill(oemFilter, unique(data.flatMap(i => i.oemArr)));
    fill(rarityFilter, unique(data.flatMap(i => i.rarityArr)));
    fill(locationFilter, unique(data.map(i => i.location)));
    fill(deviceFilter, unique(data.map(i => i.device)));
    fill(unitFilter, ["Single", "Multiple"]);
  }

  /* =========================
     FILTER + SORT
  ========================= */

  function applyFilters() {
    const q = search.value.toLowerCase().trim();
    currentPage = 1;
    windowStart = 1;

    filtered = data.filter(i => {
      if (brandFilter.value    && !i.brandArr.includes(brandFilter.value)) return false;
      if (rarityFilter.value   && !i.rarityArr.includes(rarityFilter.value)) return false;
      if (oemFilter.value      && !i.oemArr.includes(oemFilter.value)) return false;
      if (locationFilter.value && i.location !== locationFilter.value) return false;
      if (deviceFilter.value   && i.device !== deviceFilter.value) return false;
      if (unitFilter.value     && i.units !== unitFilter.value) return false;

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
    if (v === "az")     filtered.sort((a,b)=>a.brandArr[0].localeCompare(b.brandArr[0]));
    if (v === "za")     filtered.sort((a,b)=>b.brandArr[0].localeCompare(a.brandArr[0]));
    if (v === "units")  filtered.sort((a,b)=>b.unitCount - a.unitCount);

    render();
  }

  /* =========================
     INTERSECTION OBSERVER
  ========================= */

  function setupObserver() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const card = entry.target;
        const img = card.querySelector("img");

        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.onload = () => img.classList.remove("loading");
          delete img.dataset.src;
        }

        card.classList.add("visible");
        observer.unobserve(card);
      });
    }, { rootMargin: "200px" });
  }

  /* =========================
     RENDER
  ========================= */

  function render() {
    gallery.innerHTML = "";
    setupObserver();

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * PER_PAGE;
    const end = Math.min(start + PER_PAGE, total);

    filtered.slice(start, end).forEach(item => {
      const index = filtered.indexOf(item);

      const card = document.createElement("div");
      card.className = "gallery-card";

      const img = document.createElement("img");
      img.className = "loading";
      img.src = item.placeholder || item.src;
      img.dataset.src = item.src;
      img.alt = item.brandArr.join(", ");
      img.onclick = () => openModal(index);

      const overlay = document.createElement("div");
      overlay.className = "overlay";
      overlay.innerHTML = `
  <strong>${item.brandArr.join(", ")}</strong><br>
  ${item.location}<br>
  ${item.date}
  ${item.tags?.length ? `
    <div class="tag-row">
      ${item.tags.map(t => `<span class="tag">${t}</span>`).join("")}
    </div>
  ` : ""}
`;

      if (item.units === "Multiple") {
        const badge = document.createElement("div");
        badge.className = "unit-badge";
        badge.textContent = "Multiple units";
        card.appendChild(badge);
      }

      card.append(img, overlay);
      gallery.appendChild(card);
      observer.observe(card);
    });

    updateStatus(start + 1, end, total, totalPages);
    renderPagination(totalPages);
  }

  /* =========================
     STATUS + PAGINATION
  ========================= */

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
      prev.onclick = () => {
        windowStart -= PAGE_WINDOW;
        currentPage = windowStart;
        render();
      };
      pagination.appendChild(prev);
    }

    for (let i = windowStart; i <= end; i++) {
      const b = document.createElement("button");
      b.textContent = i;
      b.className = i === currentPage ? "active" : "";
      b.onclick = () => {
        currentPage = i;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      pagination.appendChild(b);
    }

    if (end < totalPages) {
      const next = document.createElement("button");
      next.textContent = "»";
      next.onclick = () => {
        windowStart += PAGE_WINDOW;
        currentPage = windowStart;
        render();
      };
      pagination.appendChild(next);
    }
  }

/* =========================
   MODAL (FIXED & CLEAN)
========================= */

/* one-time zoom handler */
modalImg.addEventListener("click", () => {
  modalImg.classList.toggle("zoomed");
});

function openModal(i) {
  currentIndex = i;
  const item = filtered[i];

  /* reset zoom every open */
  modalImg.classList.remove("zoomed");
  modalImg.src = item.src;

  modalMeta.innerHTML = `
    <div><b>Brand:</b> ${item.brandArr.join(", ")}</div>
    <div><b>OEM:</b> ${item.oemArr.join(", ")}</div>
    <div><b>Rarity:</b> ${item.rarityArr.join(", ")}</div>
    <div><b>Units:</b> ${item.units}</div>
    <div><b>Location:</b> ${item.location}</div>
    <div><b>Device:</b> ${item.device}</div>

    ${item.tags?.length ? `
      <div style="grid-column:1/-1">
        <b>Tags:</b>
        <div class="tag-row">
          ${item.tags.map(t => `<span class="tag">${t}</span>`).join("")}
        </div>
      </div>
    ` : ""}
  `;

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

/* close */
closeBtn.onclick = () => {
  modal.classList.remove("open");
  modalImg.classList.remove("zoomed");
  document.body.style.overflow = "";
};

/* click outside image closes modal */
modal.onclick = e => {
  if (e.target === modal) closeBtn.onclick();
};

/* navigation */
nextBtn.onclick = () =>
  openModal((currentIndex + 1) % filtered.length);

prevBtn.onclick = () =>
  openModal((currentIndex - 1 + filtered.length) % filtered.length);


  /* =========================
     EVENTS
  ========================= */

  search.oninput = applyFilters;
  [brandFilter, oemFilter, rarityFilter, locationFilter, deviceFilter, unitFilter]
    .forEach(f => f.onchange = applyFilters);

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
