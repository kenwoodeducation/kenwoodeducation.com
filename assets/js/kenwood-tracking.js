/* Kenwood Education: additional GA4 tracking (v2)
 *
 * Designed to be loaded ONCE from the shared layout, deferred, on every page:
 *   <script defer src="/assets/js/kenwood-tracking.js"></script>
 * It assumes gtag() is already defined by the GA snippet in <head>.
 *
 * It does NOT duplicate events already in index.html:
 * cta_click, whatsapp_click, subject_selected, entrance_exam_selected,
 * tutor_level_selected. (See kenwood-analytics-edits.md for the edits to those.)
 *
 * Sends no personal data: no names, emails, phone numbers or free text.
 */
(function () {
  if (typeof gtag !== 'function') return;
  function send(name, params) { gtag('event', name, params || {}); }

  /* 1. Phone and email clicks (WhatsApp is already tracked on index.html) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var where = a.closest('footer') ? 'footer'
              : a.closest('nav, #nav-mobile-panel') ? 'nav'
              : a.closest('.contact-row') ? 'contact_row' : 'other';
    if (href.indexOf('tel:') === 0) {
      send('phone_click', { link_location: where });
    } else if (href.indexOf('mailto:') === 0) {
      send('email_click', { link_location: where });
    } else if (href.indexOf('wa.me') !== -1 && !document.getElementById('enquiry-form')) {
      /* every page except the homepage, which already has its own whatsapp_click handler */
      send('whatsapp_click', { link_location: where });
    } else if (href.indexOf('guides/') !== -1) {
      send('guide_click', { link_url: href.slice(0, 100), link_location: where });
    }
  });

  /* 2. Which homepage sections were actually seen (40% visible, once each) */
  var ids = ['why-kenwood', 'how-it-works', 'compare', 'subjects', 'pricing', 'enquiry', 'areas', 'faq'];
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        send('section_view', { section_name: en.target.id });
        io.unobserve(en.target);
      });
    }, { threshold: 0.4 });
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* 3. Scroll depth at 25 / 50 / 75 / 100% (GA4's built-in scroll event only fires at 90%) */
  var marks = [25, 50, 75, 100], hit = {};
  window.addEventListener('scroll', function () {
    var pct = ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100;
    marks.forEach(function (m) {
      if (pct >= m - 1 && !hit[m]) { hit[m] = true; send('scroll_depth', { percent_scrolled: m }); }
    });
  }, { passive: true });

  /* 4. FAQ questions opened (includes the pricing, registration-fee and SEN questions) */
  document.querySelectorAll('#faq details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      var s = d.querySelector('summary');
      send('faq_open', { question: s ? s.childNodes[0].textContent.trim().slice(0, 90) : 'unknown' });
    });
  });

  /* 5. Enquiry form: last field touched, native validation errors, abandonment.
   * (GA4 already records form_start through Enhanced Measurement.) */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var started = false, attempted = false, abandonSent = false, lastField = '';
    form.addEventListener('focusin', function (e) {
      if (e.target && e.target.name) { started = true; lastField = e.target.name; }
    });
    form.addEventListener('submit', function () { attempted = true; });
    form.addEventListener('invalid', function (e) {
      send('form_validation_error', { field: (e.target && e.target.name) || 'unknown' });
    }, true);
    function reportAbandon() {
      if (started && !attempted && !abandonSent) {
        abandonSent = true;
        send('enquiry_form_abandon', { last_field: lastField, transport_type: 'beacon' });
      }
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') reportAbandon();
    });
    window.addEventListener('pagehide', reportAbandon);
  }

  /* 6. JavaScript errors, so a broken form doesn't fail silently */
  window.addEventListener('error', function (e) {
    send('js_error', { message: String(e.message).slice(0, 100), source: String(e.filename || '').slice(-60) });
  });
})();
