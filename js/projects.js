const CATEGORY_ICONS = {
  house: '🏠',
  villa: '🏰',
  hotel: '🏨',
  commercial: '🏢',
  industrial: '🏭',
  institutional: '🏛️',
  greenhouse: '🌿',
};

function formatPrice(cents, currency = 'usd') {
  if (!cents) return 'Contact for price';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function projectCardHTML(p, opts = {}) {
  const icon = CATEGORY_ICONS[p.category] || '🏗️';
  const showBuy = opts.showBuy !== false;
  const img = p.image_url.startsWith('http') ? p.image_url : p.image_url;
  return `
    <article class="proj-card" data-category="${p.category}" data-id="${p.id}">
      <a href="gallery.html#${p.slug}" class="pc-img-link">
        <div class="pc-img" style="background-image:url('${img}')">
          <div class="pc-img-overlay"></div>
        </div>
      </a>
      <button type="button" class="add-cart" data-id="${p.id}" data-name="${escapeAttr(p.title)}" data-icon="${icon}" data-cat="${escapeAttr(p.category)}">＋ <span data-i18n="projects.save">Save</span></button>
      ${showBuy ? `<button type="button" class="buy-now" data-buy-id="${p.id}"><span data-i18n="projects.buy">Buy now</span></button>` : ''}
      <div class="pc-body">
        <span class="pc-badge">${p.category}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description)}</p>
        <p class="pc-price">${formatPrice(p.price_cents, p.currency)}</p>
      </div>
    </article>`;
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}

async function loadProjectsInto(gridId, options = {}) {
  const grid = document.getElementById(gridId);
  if (!grid) return [];
  const lang = window.I18n?.getLang?.() || 'en';
  const params = { lang, ...options.params };
  grid.innerHTML = '<p class="gallery-loading">Loading projects…</p>';
  try {
    const { projects } = await API.projects.list(params);
    if (!projects.length) {
      grid.innerHTML = `<p class="gallery-empty" data-i18n="gallery.empty">No projects yet.</p>`;
      return [];
    }
    const limit = options.limit;
    const list = limit ? projects.slice(0, limit) : projects;
    grid.innerHTML = list.map((p) => projectCardHTML(p, options)).join('');
    bindProjectButtons(grid);
    if (window.I18n) window.I18n.apply?.();
    document.dispatchEvent(new CustomEvent('projectsloaded'));
    return projects;
  } catch (e) {
    grid.innerHTML = `<p class="gallery-empty">Could not load projects. Start the server: npm start</p>`;
    console.error(e);
    return [];
  }
}

function bindProjectButtons(container) {
  container.querySelectorAll('.add-cart').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.addToCart?.({
        id: Number(btn.dataset.id),
        name: btn.dataset.name,
        icon: btn.dataset.icon,
        cat: btn.dataset.cat,
      });
    });
  });
  container.querySelectorAll('.buy-now').forEach((btn) => {
    btn.addEventListener('click', () => window.checkoutProject?.(Number(btn.dataset.buyId)));
  });
}

function filterProjects(f) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.filter === f));
  document.querySelectorAll('#projGrid .proj-card, #galleryGrid .proj-card').forEach((c) => {
    const match = f === 'all' || c.dataset.category === f;
    c.classList.toggle('hidden', !match);
    if (match) {
      c.classList.remove('pop');
      void c.offsetWidth;
      c.classList.add('pop');
    }
  });
}

window.loadProjectsInto = loadProjectsInto;
window.filterProjects = filterProjects;
window.formatPrice = formatPrice;
