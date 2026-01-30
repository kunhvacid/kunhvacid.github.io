/* =========================
   GALLERY – CLEAN REWRITE (MODAL + NAV + ZOOM FIXED)
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
  const unitFilter = document.getElementById("unitFilter");

  const modal     = document.getElementById("modal");
  const modalImg  = document.getElementById("modal-img");
  const modalMeta = document.getElementById("modal-meta");
  const modalClose = modal.querySelector(".close");
  const nextBtn = modal.querySelector(".next");
  const prevBtn = modal.querySelector(".prev");

  /* ========= STATE ========= */
  let data = [];
  let filtered = [];
  let currentIndex = 0;
  let isZoomed = false;

  const PER_PAGE = 8;
  let currentPage = 1;

  /* ========= LOAD DATA ========= */
  fetch("gallery/gallery.json")
    .then(r => r.json())
    .then(json => {
      data = json.map(normalize);
      filtered = [...data];
      populateFilters();
      applySort();
    })
    .catch(err => console.error("Gallery load failed:", err));

  /* ========= HELPERS ========= */
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

function normalize(value) {
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return [];
}

function populateFilters() {
  fill(
    brandFilter,
    unique(data.flatMap(i => normalize(i.brand)))
  );

  fill(
    oemFilter,
    unique(data.flatMap(i => normalize(i.oem)))
  );

  fill(
    rarityFilter,
    unique(data.flatMap(i => normalize(i.rarity)))
  );

  fill(
    locationFilter,
    unique(data.map(i => i.location))
  );

  fill(
    deviceFilter,
    unique(data.map(i => i.device))
  );
}


  function applyFilters() {
    const q = search.value.toLowerCase().trim();
    currentPage = 1;

filtered = data.filter(i => {
  const text = [
    ...i.brandArr,
    ...i.rarityArr,
    i.oem,
    i.location,
    i.device,
    ...(i.tags || [])
  ].join(" ").toLowerCase();

  if (q && !text.includes(q)) return false;
  if (brandFilter.value && !i.brandArr.includes(brandFilter.value)) return false;
  if (rarityFilter.value && !i.rarityArr.includes(rarityFilter.value)) return false;
  if (oemFilter.value && i.oem !== oemFilter.value) return false;
  if (locationFilter.value && i.location !== locationFilter.value) return false;
  if (deviceFilter.value && i.device !== deviceFilter.value) return false;
  if (unitFilter.value && i.units !== unitFilter.value) return false;

  return true;
});


    applySort();
  }

  /* ========= SORT ========= */
  function applySort() {
    const v = sort.value;

    if (v === "newest") filtered.sort((a,b)=>b.date.localeCompare(a.date));
    if (v === "oldest") filtered.sort((a,b)=>a.date.localeCompare(b.date));
    if (v === "az") filtered.sort((a,b)=>a.brand.localeCompare(b.brand));
    if (v === "za") filtered.sort((a,b)=>b.brand.localeCompare(a.brand));

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
      img.alt = item.brand;
      img.loading = "lazy";

      img.addEventListener("click", () => openModal(index));

      const overlay = document.createElement("div");
      overlay.className = "overlay";
      overlay.innerHTML = `
        <strong>${item.brand}</strong><br>
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
    <p><b>Brand:</b> ${item.brandArr.join(", ")}</p>
    <p><b>OEM:</b> ${item.oem}</p>
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
  sort.addEventListener("change", applySort);

});
