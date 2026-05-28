let editingId = null;

async function requireAdmin() {
  const gate = document.getElementById('adminGate');
  const app = document.getElementById('adminApp');
  const user = API.getUser();

  if (!user || user.role !== 'admin') {
    gate.style.display = 'flex';
    app.style.display = 'none';
    return false;
  }
  gate.style.display = 'none';
  app.style.display = 'block';
  return true;
}

async function adminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  try {
    const { token, user } = await API.auth.login({ email, password });
    if (user.role !== 'admin') throw new Error('Not an admin account');
    API.setToken(token);
    API.setUser(user);
    await requireAdmin();
    await loadAdminProjects();
  } catch (err) {
    document.getElementById('adminLoginMsg').textContent = err.message;
  }
}

async function loadAdminProjects() {
  const tbody = document.getElementById('adminTableBody');
  try {
    const { projects } = await API.projects.adminList();
    const published = projects.filter((p) => p.published).length;
    const drafts = projects.length - published;
    document.getElementById('projectCount').textContent = projects.length;
    document.getElementById('publishedCount').textContent = published;
    document.getElementById('draftCount').textContent = drafts;

    if (!projects.length) {
      tbody.innerHTML = `<tr><td colspan="6">No projects found. Add a new design using the form.</td></tr>`;
      return;
    }

    tbody.innerHTML = projects
      .map(
        (p) => {
          const status = p.published ? (p.featured ? 'Published, Featured' : 'Published') : 'Draft';
          return `
      <tr>
        <td><img src="${p.image_url}" alt="${p.title_en}" class="admin-thumb"/></td>
        <td>${p.title_en}</td>
        <td>${p.category}</td>
        <td>${formatPrice(p.price_cents, p.currency)}</td>
        <td>${status}</td>
        <td>
          <button type="button" class="admin-sm" data-edit="${p.id}">Edit</button>
          <button type="button" class="admin-sm danger" data-del="${p.id}">Delete</button>
        </td>
      </tr>`;
        }
      )
      .join('');

    tbody.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => editProject(Number(btn.dataset.edit), projects));
    });
    tbody.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => deleteProject(Number(btn.dataset.del)));
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6">${e.message}</td></tr>`;
  }
}

function editProject(id, projects) {
  const p = projects.find((x) => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById('formTitle').textContent = 'Edit project';
  document.getElementById('fSlug').value = p.slug;
  document.getElementById('fCategory').value = p.category;
  document.getElementById('fTitleEn').value = p.title_en;
  document.getElementById('fTitleFr').value = p.title_fr || '';
  document.getElementById('fTitleRw').value = p.title_rw || '';
  document.getElementById('fDescEn').value = p.description_en;
  document.getElementById('fDescFr').value = p.description_fr || '';
  document.getElementById('fDescRw').value = p.description_rw || '';
  document.getElementById('fPrice').value = (p.price_cents / 100).toFixed(2);
  document.getElementById('fFeatured').checked = !!p.featured;
  document.getElementById('fPublished').checked = !!p.published;
  document.getElementById('fImageUrl').value = p.image_url.startsWith('/uploads') ? '' : p.image_url;
}

function resetForm() {
  editingId = null;
  document.getElementById('projectForm').reset();
  document.getElementById('formTitle').textContent = 'Add new project';
}

async function submitProject(e) {
  e.preventDefault();
  const fd = new FormData();
  const file = document.getElementById('fImage').files[0];
  if (file) fd.append('image', file);
  else if (document.getElementById('fImageUrl').value) {
    fd.append('image_url', document.getElementById('fImageUrl').value);
  } else if (!editingId) {
    showToast('Image file or URL required');
    return;
  }

  fd.append('slug', document.getElementById('fSlug').value);
  fd.append('category', document.getElementById('fCategory').value);
  fd.append('title_en', document.getElementById('fTitleEn').value);
  fd.append('title_fr', document.getElementById('fTitleFr').value);
  fd.append('title_rw', document.getElementById('fTitleRw').value);
  fd.append('description_en', document.getElementById('fDescEn').value);
  fd.append('description_fr', document.getElementById('fDescFr').value);
  fd.append('description_rw', document.getElementById('fDescRw').value);
  const price = parseFloat(document.getElementById('fPrice').value) || 0;
  fd.append('price_cents', String(Math.round(price * 100)));
  fd.append('currency', 'usd');
  fd.append('featured', document.getElementById('fFeatured').checked ? '1' : '0');
  fd.append('published', document.getElementById('fPublished').checked ? '1' : '0');

  try {
    if (editingId) await API.projects.update(editingId, fd);
    else await API.projects.create(fd);
    showToast(editingId ? 'Project updated' : 'Project created');
    resetForm();
    await loadAdminProjects();
  } catch (err) {
    showToast(err.message);
  }
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  try {
    await API.projects.remove(id);
    showToast('Deleted');
    await loadAdminProjects();
  } catch (e) {
    showToast(e.message);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('adminLoginForm')?.addEventListener('submit', adminLogin);
  document.getElementById('projectForm')?.addEventListener('submit', submitProject);
  document.getElementById('resetFormBtn')?.addEventListener('click', resetForm);

  if (API.getToken()) {
    try {
      const { user } = await API.auth.me();
      API.setUser(user);
    } catch {
      API.clearAuth();
    }
  }

  if (await requireAdmin()) await loadAdminProjects();
});
