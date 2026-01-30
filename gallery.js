/* ========= PAGINATION (WINDOWED 10 PAGES) ========= */

const PAGE_WINDOW = 10;
let pageWindowStart = 1;

function renderPagination() {
  pagination.innerHTML = "";
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  if (totalPages <= 1) return;

  const windowEnd = Math.min(pageWindowStart + PAGE_WINDOW - 1, totalPages);

  /* PREV WINDOW */
  if (pageWindowStart > 1) {
    const prev = document.createElement("button");
    prev.textContent = "‹";
    prev.onclick = () => {
      pageWindowStart = Math.max(1, pageWindowStart - PAGE_WINDOW);
      currentPage = pageWindowStart;
      render();
    };
    pagination.appendChild(prev);
  }

  /* PAGE BUTTONS */
  for (let i = pageWindowStart; i <= windowEnd; i++) {
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

  /* NEXT WINDOW */
  if (windowEnd < totalPages) {
    const next = document.createElement("button");
    next.textContent = "›";
    next.onclick = () => {
      pageWindowStart = pageWindowStart + PAGE_WINDOW;
      currentPage = pageWindowStart;
      render();
    };
    pagination.appendChild(next);
  }
}

/* RESET WINDOW WHEN FILTERS CHANGE */
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
