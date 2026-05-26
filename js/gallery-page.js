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
