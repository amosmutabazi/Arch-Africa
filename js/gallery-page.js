window.openProjectDetails = async function (slug) {
  try {
    const { project } = await API.projects.list({ lang: I18n?.getLang?.() || 'en' })
      .then(({ projects }) => {
        const p = projects.find((pr) => pr.slug === slug) || window.OFFLINE_PROJECTS?.find((pr) => pr.slug === slug);
        return { project: p };
      })
      .catch(() => {
        const p = window.OFFLINE_PROJECTS?.find((pr) => pr.slug === slug);
        return { project: p };
      });
    
    if (!project) return;

    const modal = document.getElementById('projectDetailsModal');
    document.getElementById('pdImage').src = project.image_url || 'assets/placeholder.jpg';
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
    document.getElementById('pdWhatsapp').href = `https://wa.me/${window.WHATSAPP_NUMBER || '250788000000'}?text=${whatsappText}`;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  } catch (e) {
    console.error('Error opening project details', e);
  }
};

window.closeProjectDetails = function () {
  const modal = document.getElementById('projectDetailsModal');
  modal.classList.remove('open');
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

// Close modal when clicking outside the modal card
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

  await loadProjectsInto('galleryGrid', { showBuy: true });

  if (location.hash) {
    const slug = location.hash.slice(1);
    const card = document.querySelector(`[data-category]`);
    document.querySelectorAll('.proj-card').forEach((c) => {
      if (c.querySelector(`a[href*="${slug}"]`)) c.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    loadProjectsInto('galleryGrid', { showBuy: true }).then(() => filterProjects(filter));
  });

  if (params.get('canceled')) showToast('Checkout canceled');
});
