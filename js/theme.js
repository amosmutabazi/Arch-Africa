(function () {
  const KEY = 'aa_theme';
  const root = document.documentElement;

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    document.querySelectorAll('[data-theme-icon]').forEach((el) => {
      el.textContent = theme === 'light' ? '🌙' : '☀️';
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'light' ? '#f5f5f0' : '#080808';
  }

  const saved = localStorage.getItem(KEY);
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  apply(saved || (prefersLight ? 'light' : 'dark'));

  window.toggleTheme = function () {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    apply(next);
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('#themeToggle')) {
      e.preventDefault();
      window.toggleTheme();
    }
  });
})();
