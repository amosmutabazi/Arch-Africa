(function () {
  const KEY = 'aa_lang';
  let strings = {};
  let lang = localStorage.getItem(KEY) || 'en';

  async function loadLocale(l) {
    const res = await fetch(`/locales/${l}.json`);
    if (!res.ok) throw new Error('Locale not found');
    strings = await res.json();
    lang = l;
    localStorage.setItem(KEY, l);
    document.documentElement.lang = l === 'rw' ? 'rw' : l;
    apply();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: l } }));
  }

  function t(key, fallback) {
    return strings[key] ?? fallback ?? key;
  }

  function apply() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = val;
      else el.textContent = val;
    });
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  window.I18n = { t, loadLocale, getLang: () => lang, apply };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-btn');
    if (btn?.dataset.lang) loadLocale(btn.dataset.lang);
  });

  loadLocale(lang).catch(() => loadLocale('en'));
})();
