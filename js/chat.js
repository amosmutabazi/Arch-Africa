(function () {
  async function initTawk() {
    try {
      const cfg = await API.config();
      const pid = cfg.tawkPropertyId;
      if (!pid) return;

      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_LoadStart = new Date();
      const s1 = document.createElement('script');
      const s0 = document.getElementsByTagName('script')[0];
      s1.async = true;
      s1.src = `https://embed.tawk.to/${pid}/${cfg.tawkWidgetId || 'default'}`;
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      s0.parentNode.insertBefore(s1, s0);
    } catch (e) {
      console.warn('Live chat not loaded:', e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTawk);
  } else initTawk();
})();
