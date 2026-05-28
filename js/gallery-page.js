window.openProjectDetails = async function (slug) {
  try {
    const { projects } = await API.projects.list({ lang: window.I18n?.getLang?.() || 'en' });
    const project = projects.find((pr) => pr.slug === slug);
    if (!project) return;

    document.getElementById('pdImage').src = project.image_url || 'assets/arch-africa-logo.png';
    document.getElementById('pdTitle').textContent = project.title;
    document.getElementById('pdCategory').textContent = project.category.charAt(0).toUpperCase() + project.category.slice(1);
    document.getElementById('pdPrice').textContent = formatPrice(project.price_cents, project.currency);
    document.getElementById('pdDescription').textContent = project.description;

    const icon = CATEGORY_ICONS[project.category] || '🏗️';
    document.getElementById('pdAddCart').onclick = () => {
      addToCart({ id: project.id, name: project.title, cat: project.category, icon });
      closeProjectDetails();
    };

    const whatsappText = encodeURIComponent(`Hello, I'm interested in the ${project.title} design.`);
    document.getElementById('pdWhatsapp').href = `https://wa.me/250798541111?text=${whatsappText}`;

    document.getElementById('projectDetailsModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  } catch (e) {
    console.error('Error opening project details', e);
  }
};

window.closeProjectDetails = function () {
  document.getElementById('projectDetailsModal').classList.remove('open');
  document.body.style.overflow = '';
};

window.openCostEstimator = function () {
  closeProjectDetails();
  const estimatorModal = document.getElementById('estimatorModal');
  if (estimatorModal) {
    estimatorModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('projectDetailsModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeProjectDetails();
    });
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const tabs = document.getElementById('galleryTabs');
  const params = new URLSearchParams(location.search);
  let filter = params.get('category') || 'all';

  await loadProjectsInto('galleryGrid', { showBuy: true, params: {} });

  if (location.hash) {
    const slug = location.hash.slice(1);
    document.querySelectorAll('.proj-card').forEach((c) => {
      if (c.querySelector(`a[href*="${slug}"]`)) {
        c.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  tabs?.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    filter = btn.dataset.filter;
    filterProjects(filter);
  });

  document.querySelectorAll('#galleryTabs .tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.filter === filter);
  });
  filterProjects(filter);

  document.addEventListener('langchange', () => {
    loadProjectsInto('galleryGrid', { showBuy: true, params: {} }).then(() => filterProjects(filter));
  });

  if (params.get('canceled')) showToast('Checkout canceled');
});
