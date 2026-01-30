/* =========================
   GALLERY – FULL REWRITE (STABLE, DEDUPED, WINDOWED PAGINATION)
========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ========= ELEMENTS ========= */
  const $ = id => document.getElementById(id);

  const gallery        = $("gallery");
  const pagination     = $("pagination");
  const search          = $("search");
  const sort            = $("sort");
  const locationFilter  = $("locationFilter");
  const deviceFilter    = $("deviceFilter");
  const brandFilter     = $("brandFilter");
  const oemFilter       = $("oemFilter");
  const rarityFilter    = $("rarityFilter");
  const unitFilter      = $("unitFilter");

  const modal     = $("modal");
  const modalImg  = $("modal-img");
  const modalMeta = $("modal-meta");

  const closeBtn = modal.querySelector(".close");
  const nextBtn  = modal.querySelector(".next");
  const prevBtn  = modal.querySelector(".prev");

  /* ========= STATE ========= */
  let data = [];
  let filtered = [];

  const PER_PAGE = 7;
  const PAGE_WINDOW = 10;

  let currentPage = 1;
  let pageWindowStart = 1;
  let currentIndex = 0;
  let isZoomed = false;

  /* ========= HELPERS ========= */
  const toArray = v =>
    Array.isArray(v)
      ? v.map(x => x.trim())
      : typeof v === "string"
        ? v.split(",").map(x => x.trim()).filter(Boolean)
        : [];

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

  /* ========= LOAD ========= */
  fetch("gallery/gallery.json")
    .then(r => r.json())
    .then(json => {
      data = json.map(normalize);
      filtered = [...data];
      populateFilters();
      applySort();
    })
    .catch(err => console.error("Gallery load failed:", err));

  /* ========= FILTER OPTIONS ========= */
  function populateFilters() {
    fill(brandFilter,    unique(data.flatMap(i => i.brandArr)));
    fill(oemFilter,      unique(data.flatMap(i => i.oemArr)));
    fill(rarityFilter,   unique(data.flatMap(i => i.rarityArr)));
    fill(locationFilter, unique(data.map(i => i.location)));
    fill(deviceFilter,   unique(data.map(i => i.device)));
    fill(unitFilter, ["Single", "Multiple"]);
  }

  /* ========= FILTER ========= */
  function applyFilters() {
    const q = search.value.toLowerCase().trim();
    currentPage = 1;
    pageWindowStart = 1;

    filtered = data.filter(i => {
      const text = [
        ...i.brandArr,
        ...i.oemArr,
        ...i.rarityArr,
        i.location,
        i.device,
        ...(i.tags || [])
      ].join(" ").toLowerCase();

      if (q && !text.includes(q)) return false;
      if (brandFilter.value && !i.brandArr.includes(brandFilter.value)) return false;
      if (oemFilter.value && !i.oemArr.includes(oemFilter.value)) return false;
      if (rarityFilter.value && !i.rarityArr.includes(rarityFilter.value)) return false;
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
    if (v === "az") filtered.sort((a,b)=>a.brandArr[0].localeCompare(b.brandArr[0]));
    if (v === "za") filtered.sort((a,b)=>b.brandArr[0].localeCompare(a.brandArr[0]));

    render();
  }

  /* ========= RENDER ========= */
  function render() {
    gallery.innerHTML = "";

    const start = (currentPage - 1) * PER_PAGE;
    const items = filtered.slice(start, start + PER_PAGE);

    items.forEach(item => {
      const index = data.indexOf(item);

      const card = document.createElement("div");
      card.className = "gallery-card";

      const img = document.createElement("img");
      img.src = item.src;
      img.loading = "lazy";
      img.alt = item.brandArr.join(", ");
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

    renderPagination();
  }

  /* ========= PAGINATION ========= */
  function renderPagination() {
    pagination.innerHTML = "";
    const total = Math.ceil(filtered.length / PER_PAGE);
    if (total <= 1) return;

    const end = Math.min(pageWindowStart + PAGE_WINDOW - 1, total);

    if (pageWindowStart > 1) {
      const prev = document.createElement("button");
      prev.textContent = "‹";
      prev.onclick = () => {
        pageWindowStart -= PAGE_WINDOW;
        currentPage = pageWindowStart;
        render();
      };
      pagination.appendChild(prev);
    }

    for (let i = pageWindowStart; i <= end; i++) {
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

    if (end < total) {
      const next = document.createElement("button");
      next.textContent = "›";
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
    const i = data[index];

    modalImg.src = i.src;
    modalMeta.innerHTML = `
      <p><b>Brand:</b> ${i.brandArr.join(", ")}</p>
      <p><b>OEM:</b> ${i.oemArr.join(", ")}</p>
      <p><b>Rarity:</b> ${i.rarityArr.join(", ")}</p>
      <p><b>Units:</b> ${i.units}</p>
      <p><b>Location:</b> ${i.location}</p>
      <p><b>Device:</b> ${i.device}</p>
      <p>${(i.tags || []).join(", ")}</p>
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

  closeBtn.onclick = closeModal;
  modal.onclick = e => { if (e.target === modal) closeModal(); };

  modalImg.onclick = e => {
    e.stopPropagation();
    isZoomed = !isZoomed;
    modalImg.classList.toggle("zoomed", isZoomed);
  };

  nextBtn.onclick = e => {
    e.stopPropagation();
    openModal((currentIndex + 1) % data.length);
  };

  prevBtn.onclick = e => {
    e.stopPropagation();
    openModal((currentIndex - 1 + data.length) % data.length);
  };

  /* ========= EVENTS ========= */
  search.oninput = applyFilters;
  brandFilter.onchange = applyFilters;
  oemFilter.onchange = applyFilters;
  rarityFilter.onchange = applyFilters;
  locationFilter.onchange = applyFilters;
  deviceFilter.onchange = applyFilters;
  unitFilter.onchange = applyFilters;
  sort.onchange = applySort;

});
