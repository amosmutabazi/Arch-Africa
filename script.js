/* ── Year ── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Custom cursor ── */
const cur = document.getElementById('cur');
const curR = document.getElementById('curR');
if (cur && curR) {
  document.addEventListener('mousemove', (e) => {
    cur.style.left = e.clientX + 'px';
    cur.style.top = e.clientY + 'px';
    curR.style.left = e.clientX + 'px';
    curR.style.top = e.clientY + 'px';
  });
}

/* ── Toast ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
function setMsg(id, msg, type = 'ok') {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = 'auth-msg ' + type;
}

/* ── Modal ── */
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
['authModal', 'estimatorModal'].forEach((id) => {
  document.getElementById(id)?.addEventListener('click', (e) => {
    if (e.target.id === id) closeModal(id);
  });
});

/* ── Auth panel ── */
function showPanel(p) {
  ['pLogin', 'pReg', 'pForgot'].forEach((x) => document.getElementById(x).classList.remove('active'));
  document.getElementById('authTabs').style.display = p === 'forgot' ? 'none' : 'flex';
  document.getElementById('aTabLogin').classList.toggle('active', p === 'login');
  document.getElementById('aTabReg').classList.toggle('active', p === 'register');
  if (p === 'login') {
    document.getElementById('pLogin').classList.add('active');
    document.getElementById('authH2').textContent = I18n?.t('auth.welcome', 'Welcome Back') || 'Welcome Back';
    document.getElementById('authSub').textContent = 'Sign in to your ARCH-AFRICA account.';
  } else if (p === 'register') {
    document.getElementById('pReg').classList.add('active');
    document.getElementById('authH2').textContent = I18n?.t('auth.create', 'Create Account') || 'Create Account';
    document.getElementById('authSub').textContent = 'Join ARCH-AFRICA and start your project.';
  } else {
    document.getElementById('pForgot').classList.add('active');
    document.getElementById('authH2').textContent = 'Reset Password';
    document.getElementById('authSub').textContent = "We'll help you regain access.";
    ['fs1', 'fs2', 'fs3'].forEach((s) => document.getElementById(s).classList.remove('active'));
    document.getElementById('fs1').classList.add('active');
  }
}
document.getElementById('aTabLogin')?.addEventListener('click', () => showPanel('login'));
document.getElementById('aTabReg')?.addEventListener('click', () => showPanel('register'));
document.getElementById('openLoginBtn')?.addEventListener('click', () => {
  showPanel('login');
  openModal('authModal');
});
document.getElementById('openRegBtn')?.addEventListener('click', () => {
  showPanel('register');
  openModal('authModal');
});

function oauthNote(id) {
  setMsg(id, 'OAuth integration coming soon.', 'ok');
}

/* ── Dynamic projects (CMS) ── */
document.addEventListener('DOMContentLoaded', () => {
  loadProjectsInto('projGrid', { limit: 4, showBuy: true }).then(() => {
    document.getElementById('projTabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab');
      if (!btn) return;
      filterProjects(btn.dataset.filter);
    });
    document.querySelectorAll('[data-filter]').forEach((el) => {
      el.addEventListener('click', () => {
        if (el.dataset.filter) filterProjects(el.dataset.filter);
      });
    });
  });

  document.addEventListener('langchange', () => {
    loadProjectsInto('projGrid', { limit: 4, showBuy: true });
  });
});

/* ── Hero slideshow & morph text ── */
const morphWords = ['Africa', 'Kigali', 'East Africa', 'Your Vision', 'The Future', 'Our Community'];
let curSlide = 0,
  curWord = 0;
const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.hero-dot');

function goSlide(i) {
  if (!slides.length) return;
  slides[curSlide].classList.remove('active');
  dots[curSlide]?.classList.remove('active');
  curSlide = i;
  slides[curSlide].classList.add('active');
  dots[curSlide]?.classList.add('active');
  const heroNum = document.getElementById('heroNum');
  if (heroNum)
    heroNum.textContent =
      String(i + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
}
dots.forEach((d) => d.addEventListener('click', () => goSlide(+d.dataset.i)));

function morphNext() {
  const el = document.getElementById('morphWord');
  if (!el) return;
  el.classList.remove('in');
  el.classList.add('out');
  setTimeout(() => {
    curWord = (curWord + 1) % morphWords.length;
    el.textContent = morphWords[curWord];
    el.classList.remove('out');
    el.classList.add('in');
  }, 400);
}

if (slides.length) {
  setInterval(() => {
    goSlide((curSlide + 1) % slides.length);
    morphNext();
  }, 4000);
}

/* ── Search ── */
let searchData = [
  { name: 'Project Gallery', cat: 'Page', sec: 'gallery.html' },
  { name: 'Architectural Drawings', cat: 'Service', sec: '#services' },
  { name: 'Building Cost Estimator', cat: 'Tool', sec: null },
  { name: 'FAQ', cat: 'Page', sec: '#faq' },
  { name: 'Contact Us', cat: 'Page', sec: '#contact' },
];

document.addEventListener('projectsloaded', async () => {
  try {
    const { projects } = await API.projects.list({ lang: I18n?.getLang() || 'en' });
    searchData = [
      ...projects.map((p) => ({ name: p.title, cat: p.category, sec: `gallery.html#${p.slug}` })),
      ...searchData,
    ];
  } catch (_) {}
});

function openSearch() {
  document.getElementById('searchOv').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('sInput').focus(), 100);
}
function closeSearch() {
  document.getElementById('searchOv').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('sInput').value = '';
  document.getElementById('sResults').innerHTML = '';
}
document.getElementById('openSearchBtn')?.addEventListener('click', openSearch);
document.getElementById('sClose')?.addEventListener('click', closeSearch);
document.getElementById('searchOv')?.addEventListener('click', (e) => {
  if (e.target.id === 'searchOv') closeSearch();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSearch();
});
document.getElementById('sInput')?.addEventListener('input', function () {
  const q = this.value.toLowerCase().trim();
  const res = document.getElementById('sResults');
  if (!q) {
    res.innerHTML = '';
    return;
  }
  const hits = searchData.filter(
    (d) => d.name.toLowerCase().includes(q) || d.cat.toLowerCase().includes(q)
  );
  if (!hits.length) {
    res.innerHTML =
      '<p style="color:var(--muted);text-align:center;font-size:.84rem">No results found.</p>';
    return;
  }
  res.innerHTML = hits
    .map((m) => {
      const action = m.sec
        ? m.sec.startsWith('#')
          ? `closeSearch();document.querySelector('${m.sec}')?.scrollIntoView({behavior:'smooth'})`
          : `closeSearch();location.href='${m.sec}'`
        : `closeSearch();openModal('estimatorModal')`;
      return `<div class="s-item" onclick="${action}"><span class="s-item-name">${m.name}</span><span class="s-item-cat">${m.cat}</span></div>`;
    })
    .join('');
});

/* ── Navbar scroll ── */
const siteHeader = document.querySelector('header');
window.addEventListener(
  'scroll',
  () => {
    if (siteHeader) siteHeader.classList.toggle('scrolled', window.scrollY > 40);
  },
  { passive: true }
);

/* ── Back to top ── */
const backTop = document.getElementById('backTop');
if (backTop) {
  window.addEventListener(
    'scroll',
    () => {
      backTop.classList.toggle('visible', window.scrollY > 500);
    },
    { passive: true }
  );
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── Contact inquiry form ── */
const inquiryForm = document.getElementById('inquiryForm');
if (inquiryForm) {
  inquiryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const note = document.getElementById('inqNote');
    const name = document.getElementById('inqName').value.trim();
    const email = document.getElementById('inqEmail').value.trim();
    const phone = document.getElementById('inqPhone').value.trim();
    const type = document.getElementById('inqType').value;
    const msg = document.getElementById('inqMsg').value.trim();
    if (!name || !email || !msg) {
      note.textContent = 'Please fill in name, email, and message.';
      note.className = 'inquiry-note err';
      return;
    }
    const subject = encodeURIComponent(`ARCH-AFRICA inquiry: ${type}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone || '—'}\nProject type: ${type}\n\n${msg}`
    );
    window.location.href = `mailto:info@archafricabureau.com?subject=${subject}&body=${body}`;
    note.textContent = 'Opening your email app…';
    note.className = 'inquiry-note ok';
    showToast('Draft email ready');
  });
}

/* ── Mobile nav ── */
function closeMNav() {
  document.getElementById('mobileNav').classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('mobileNav').classList.toggle('open');
  document.body.style.overflow = document.getElementById('mobileNav').classList.contains('open')
    ? 'hidden'
    : '';
});
document.getElementById('mClose')?.addEventListener('click', closeMNav);
document.getElementById('mobileNav')?.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMNav));
document.getElementById('mProjTog')?.addEventListener('click', () => document.getElementById('mProjSub').classList.toggle('open'));
document.getElementById('mResTog')?.addEventListener('click', () => {
  const s = document.getElementById('mResSub');
  s.style.display = s.style.display === 'flex' ? 'none' : 'flex';
});

/* ── Cost estimator ── */
function calcCost(e) {
  e.preventDefault();
  const v = (id) => parseFloat(document.getElementById(id).value) || 0;
  const area = (a, b) => v(a) * v(b);
  const floors = v('floorSel');
  const house = area('hL', 'hW') * floors;
  const rooms =
    ['li', 'di', 'ki'].reduce((s, r) => s + area(r + 'L', r + 'W'), 0) +
    ['ma', 'b1', 'b2', 'b3'].reduce((s, r) => s + area(r + 'L', r + 'W'), 0);
  const ann = area('anL', 'anW');
  const fence = (v('feL') + v('feW')) * 2 * 180000;
  const ext = area('exL', 'exW') * 120000;
  const total = (house + rooms + ann) * 450000 + fence + ext;
  document.getElementById('estRes').textContent =
    `Total Estimated Cost: ${Math.round(total).toLocaleString()} RWF`;
}

/* ── Scroll reveal ── */
const ro = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        ro.unobserve(en.target);
      }
    });
  },
  { threshold: 0.08 }
);
document.querySelectorAll('.reveal').forEach((el) => ro.observe(el));

/* ── 1-MINUTE POPUP ── */
function closePopup() {
  document.getElementById('popupBd').classList.remove('open');
  document.body.style.overflow = '';
}
if (!sessionStorage.getItem('aa_pop')) {
  setTimeout(() => {
    document.getElementById('popupBd')?.classList.add('open');
    document.body.style.overflow = 'hidden';
    sessionStorage.setItem('aa_pop', '1');
  }, 60000);
}
document.getElementById('popupBd')?.addEventListener('click', (e) => {
  if (e.target.id === 'popupBd') closePopup();
});

window.addEventListener('load', () => {
  document.getElementById('loader')?.classList.add('hide');
  updateAuthUI?.();
});
