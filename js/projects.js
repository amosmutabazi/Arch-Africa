const CATEGORY_ICONS = {
  house: '🏠',
  villa: '🏰',
  hotel: '🏨',
  commercial: '🏢',
  industrial: '🏭',
  institutional: '🏛️',
  greenhouse: '🌿',
};
const WHATSAPP_NUMBER = '250798541111';

function formatPrice(cents, currency = 'rwf') {
  if (!cents) return 'Contact for price';
  const amount = currency.toLowerCase() === 'usd'
    ? Math.round((cents / 100) * 1350)
    : Math.round(cents / 100);
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(amount);
}

function projectCardHTML(p, opts = {}) {
  const icon = CATEGORY_ICONS[p.category] || '🏗️';
  const img = p.image_url ? String(p.image_url) : 'assets/arch-africa-logo.png';
  const whatsappText = encodeURIComponent(`Hello, I am interested in the ${p.title} design.`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`;
  const onReadMore = window.location.pathname.includes('gallery.html')
    ? `openProjectDetails('${p.slug}')`
    : `location.href='gallery.html#${p.slug}'`;
  return `
    <article class="proj-card" data-category="${p.category}" data-id="${p.id}">
      <a href="gallery.html#${p.slug}" class="pc-img-link">
        <div class="pc-img" style="background-image:url('${img}')">
          <div class="pc-img-overlay"></div>
        </div>
      </a>
      <div class="pc-body">
        <span class="pc-badge">${p.category}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description)}</p>
        <p class="pc-price">${formatPrice(p.price_cents, p.currency)}</p>
        <div class="pc-actions">
          <button type="button" class="pc-action pc-more" onclick="${onReadMore}" title="Read more">➜</button>
          <a class="pc-action pc-wa" href="${whatsappUrl}" target="_blank" rel="noopener" title="WhatsApp contact">💬</a>
          <button type="button" class="pc-action pc-add-cart" data-id="${p.id}" data-name="${escapeAttr(p.title)}" data-icon="${icon}" data-cat="${escapeAttr(p.category)}" title="Add to cart">＋</button>
        </div>
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

window.OFFLINE_PROJECTS = [];

async function loadProjectsInto(gridId, options = {}) {
  const grid = document.getElementById(gridId);
  if (!grid) return [];
  const lang = window.I18n?.getLang?.() || 'en';
  const params = { lang, ...options.params };
  grid.innerHTML = '<p class="gallery-loading">Loading projects…</p>';
  try {
    const { projects } = await API.projects.list(params);
    if (!projects || !projects.length) {
      grid.innerHTML = '<p style="text-align:center;color:var(--muted);padding:2rem">No projects found.</p>';
      document.dispatchEvent(new CustomEvent('projectsloaded'));
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
    console.error('Failed to load projects:', e);
    grid.innerHTML = '<p style="text-align:center;color:var(--muted);padding:2rem">Failed to load projects. Please refresh.</p>';
    document.dispatchEvent(new CustomEvent('projectsloaded'));
    return [];
  }
}

function bindProjectButtons(grid) {
  grid.querySelectorAll('.pc-add-cart').forEach((btn) => {
    btn.addEventListener('click', () => {
      addToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        cat: btn.dataset.cat,
        icon: btn.dataset.icon,
      });
    });
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
