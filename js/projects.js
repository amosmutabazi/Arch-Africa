const CATEGORY_ICONS = {
  house: '🏠',
  villa: '🏰',
  hotel: '🏨',
  commercial: '🏢',
  industrial: '🏭',
  institutional: '🏛️',
  greenhouse: '🌿',
};
const WHATSAPP_NUMBER = '250788000000';

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
  const img = p.image_url.startsWith('http') ? p.image_url : p.image_url;
  const whatsappText = encodeURIComponent(`Hello, I am interested in the ${p.title} design.`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`;
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
          <a class="pc-action pc-more" href="gallery.html#${p.slug}">Read more</a>
          <a class="pc-action pc-wa" href="${whatsappUrl}" target="_blank" rel="noopener">WhatsApp</a>
          <button type="button" class="pc-action pc-add-cart" data-id="${p.id}" data-name="${escapeAttr(p.title)}" data-icon="${icon}" data-cat="${escapeAttr(p.category)}">Add to cart</button>
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

const OFFLINE_PROJECTS = [
  {
    id: 0,
    title: 'Modern Family Home',
    description: 'A warm, modern residence with bright open-plan living.',
    category: 'house',
    slug: 'modern-family-home',
    image_url: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80',
    price_cents: 29000000000,
    currency: 'rwf',
  },
  {
    id: 1,
    title: 'Minimalist Suburban House',
    description: 'Clean lines, natural materials and a quiet courtyard.',
    category: 'house',
    slug: 'minimalist-suburban-house',
    image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
    price_cents: 23500000000,
    currency: 'rwf',
  },
  {
    id: 2,
    title: 'Lakefront Residence',
    description: 'A luxurious home with panoramic water views.',
    category: 'house',
    slug: 'lakefront-residence',
    image_url: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80',
    price_cents: 32000000000,
    currency: 'rwf',
  },
  {
    id: 3,
    title: 'Luxury Garden Villa',
    description: 'Private villa with lush gardens and premium finishes.',
    category: 'villa',
    slug: 'luxury-garden-villa',
    image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
    price_cents: 45000000000,
    currency: 'rwf',
  },
  {
    id: 4,
    title: 'Modern Beach Villa',
    description: 'An ocean-edge retreat with expansive terraces.',
    category: 'villa',
    slug: 'modern-beach-villa',
    image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
    price_cents: 52000000000,
    currency: 'rwf',
  },
  {
    id: 5,
    title: 'Forest Courtyard Villa',
    description: 'A secluded villa that blends indoor and outdoor spaces.',
    category: 'villa',
    slug: 'forest-courtyard-villa',
    image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
    price_cents: 41000000000,
    currency: 'rwf',
  },
  {
    id: 6,
    title: 'Rooftop City Hotel',
    description: 'Contemporary hotel design for premium urban guests.',
    category: 'hotel',
    slug: 'rooftop-city-hotel',
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    price_cents: 68000000000,
    currency: 'rwf',
  },
  {
    id: 7,
    title: 'Boutique Hotel Lobby',
    description: 'A stylish hotel lobby with boutique hospitality flair.',
    category: 'hotel',
    slug: 'boutique-hotel-lobby',
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    price_cents: 59000000000,
    currency: 'rwf',
  },
  {
    id: 8,
    title: 'Resort Hotel Suites',
    description: 'Spacious guest suites for resort-style hospitality.',
    category: 'hotel',
    slug: 'resort-hotel-suites',
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    price_cents: 72000000000,
    currency: 'rwf',
  },
  {
    id: 9,
    title: 'Urban Office Tower',
    description: 'A landmark commercial tower designed for business tenants.',
    category: 'commercial',
    slug: 'urban-office-tower',
    image_url: 'https://images.unsplash.com/photo-1531870975029-75471b00a667?w=1200&q=80',
    price_cents: 76000000000,
    currency: 'rwf',
  },
  {
    id: 10,
    title: 'Creative Studio Complex',
    description: 'Flexible commercial space built for creative teams.',
    category: 'commercial',
    slug: 'creative-studio-complex',
    image_url: 'https://images.unsplash.com/photo-1531870975029-75471b00a667?w=1200&q=80',
    price_cents: 43000000000,
    currency: 'rwf',
  },
  {
    id: 11,
    title: 'Retail Plaza',
    description: 'A modern plaza with retail storefronts and dining zones.',
    category: 'commercial',
    slug: 'retail-plaza',
    image_url: 'https://images.unsplash.com/photo-1531870975029-75471b00a667?w=1200&q=80',
    price_cents: 50000000000,
    currency: 'rwf',
  },
];

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
    console.error(e);
    const list = options.limit ? OFFLINE_PROJECTS.slice(0, options.limit) : OFFLINE_PROJECTS;
    grid.innerHTML = list.map((p) => projectCardHTML(p, options)).join('');
    bindProjectButtons(grid);
    if (window.I18n) window.I18n.apply?.();
    document.dispatchEvent(new CustomEvent('projectsloaded'));
    return list;
  }
}

function bindProjectButtons(container) {
  container.querySelectorAll('.add-cart, .pc-add-cart').forEach((btn) => {
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
