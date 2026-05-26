let cart = JSON.parse(localStorage.getItem('aa_cart') || '[]');

function saveCart() {
  localStorage.setItem('aa_cart', JSON.stringify(cart));
}

window.addToCart = function (item) {
  if (cart.find((c) => c.id === item.id || c.name === item.name)) {
    showToast('Already saved!');
    return;
  }
  cart.push(item);
  saveCart();
  updateBadge();
  renderCart();
  showToast('✓ Design saved');
};

function updateBadge() {
  const b = document.getElementById('cartBadge');
  if (!b) return;
  b.textContent = cart.length;
  b.classList.toggle('on', cart.length > 0);
}

function renderCart() {
  const body = document.getElementById('cartBody');
  if (!body) return;
  if (!cart.length) {
    body.innerHTML =
      '<div class="cart-empty"><span>🛒</span>No designs saved yet.<br>Browse projects and click + to save.</div>';
    return;
  }
  body.innerHTML = cart
    .map(
      (c, i) => `
    <div class="c-item">
      <span class="ci-ic">${c.icon || '🏠'}</span>
      <div class="ci-inf"><h4>${escapeHtml(c.name)}</h4><p>${escapeHtml(c.cat || '')}</p></div>
      <button type="button" class="ci-rm" data-i="${i}">✕</button>
    </div>`
    )
    .join('');
  body.querySelectorAll('.ci-rm').forEach((btn) => {
    btn.addEventListener('click', () => {
      cart.splice(Number(btn.dataset.i), 1);
      saveCart();
      updateBadge();
      renderCart();
    });
  });
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

window.openCartDrawer = function () {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOv')?.classList.add('open');
  document.body.style.overflow = 'hidden';
};
window.closeCart = function () {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartOv')?.classList.remove('open');
  document.body.style.overflow = '';
};
window.removeCart = function (i) {
  cart.splice(i, 1);
  saveCart();
  updateBadge();
  renderCart();
};

window.checkoutProject = async function (projectId) {
  const user = API.getUser();
  if (!user) {
    showToast('Please login to purchase');
    showPanel('login');
    openModal('authModal');
    return;
  }
  try {
    const { url } = await API.payments.checkout({ projectIds: [projectId] });
    window.location.href = url;
  } catch (e) {
    showToast(e.message);
  }
};

window.checkoutCart = async function () {
  const user = API.getUser();
  if (!user) {
    showToast('Please login to checkout');
    showPanel('login');
    openModal('authModal');
    return;
  }
  const ids = cart.map((c) => c.id).filter(Boolean);
  if (!ids.length) {
    showToast('No purchasable items in cart');
    return;
  }
  try {
    const { url } = await API.payments.checkout({ projectIds: ids });
    window.location.href = url;
  } catch (e) {
    showToast(e.message);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  updateBadge();
  renderCart();
  document.getElementById('openCartBtn')?.addEventListener('click', openCartDrawer);
  document.getElementById('cartX')?.addEventListener('click', closeCart);
  document.getElementById('cartOv')?.addEventListener('click', closeCart);
});
