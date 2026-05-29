async function initAnalytics() {
  try {
    const res = await fetch('/api/config');
    const cfg = await res.json();
    const gaId = cfg.gaTrackingId || cfg.GA_TRACKING_ID || '';
    const whatsappNumber = (cfg.adminWhatsAppNumber || '').replace(/^whatsapp:/i, '').trim();

    if (whatsappNumber) {
      window.WHATSAPP_NUMBER = whatsappNumber;
      document.querySelectorAll('.whatsapp-float, #pdWhatsapp').forEach((el) => {
        if (el.tagName.toLowerCase() !== 'a') return;
        let text = el.dataset.whatsappText || '';
        if (!text) {
          try {
            const href = new URL(el.href, location.origin);
            text = href.searchParams.get('text') || '';
          } catch (err) {
            text = '';
          }
        }
        if (!text) {
          text = 'Hello ARCH-AFRICA, I need help with a project.';
        }
        el.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
      });
    }

    if (!gaId) {
      console.info('Analytics disabled: GA_TRACKING_ID not set');
      return;
    }

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    gtag('js', new Date());
    gtag('config', gaId, { anonymize_ip: true });
  } catch (err) {
    console.warn('Analytics init failed:', err);
  }
}

initAnalytics();
