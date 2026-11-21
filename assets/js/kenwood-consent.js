/*!
 * Kenwood Education cookie consent with Google Consent Mode v2
 *
 * Install: put this ONE line in the <head> of every page, as high as possible,
 * and REMOVE the existing Google Analytics (gtag.js) snippet from every page:
 *
 *   <script src="/assets/js/kenwood-consent.js"></script>
 *
 * The "Cookie settings" link is in _includes/footer-main.html so visitors can change their mind:
 *
 *   <a href="#" onclick="kwOpenCookieSettings(); return false;">Cookie settings</a>
 *
 * How it works:
 * - Google's consent defaults are set to "denied" before anything else loads.
 * - Google Analytics (and any Google Ads tag) is only loaded once a visitor
 *   agrees. Nothing is sent to Google before that.
 * - The visitor's choice is stored in localStorage (strictly necessary, no
 *   consent needed) and asked again after 12 months.
 */
(function () {
  'use strict';

  // ---- Settings -----------------------------------------------------------
  var GA_ID = 'G-RDRT6GS1QT';   // Google Analytics 4
  var ADS_ID = '';              // Google Ads tag, e.g. 'AW-123456789'. Leave '' if you import conversions from GA4.
  var META_PIXEL_ID = '1439021704748612'; // Meta (Facebook/Instagram) Pixel, loaded only with advertising consent
  var PRIVACY_URL = '/privacy#cookies';
  var STORAGE_KEY = 'kw_consent_v1';
  var MAX_AGE_DAYS = 365;

  // ---- Google Consent Mode defaults (must run before any Google tag) ------
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  var gtag = window.gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', false);

  // ---- Stored choice --------------------------------------------------------
  function readChoice() {
    try {
      var c = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (!c || typeof c.ts !== 'number') return null;
      if (Date.now() - c.ts > MAX_AGE_DAYS * 864e5) return null;
      return c;
    } catch (e) { return null; }
  }

  function saveChoice(analytics, ads) {
    var c = { analytics: !!analytics, ads: !!ads, ts: Date.now() };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch (e) {}
    return c;
  }

  // ---- Apply a choice to Google tags --------------------------------------
  var tagsLoaded = false;

  function loadGoogleTags() {
    if (tagsLoaded) return;
    tagsLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID);
    if (ADS_ID) gtag('config', ADS_ID);
  }

  var metaLoaded = false;

  function loadMetaPixel() {
    if (metaLoaded || !META_PIXEL_ID) return;
    metaLoaded = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  // Removes Google cookies already set if a visitor withdraws consent.
  function deleteCookies(prefix) {
    var host = window.location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (part) {
      var name = part.split('=')[0].trim();
      if (name.indexOf(prefix) !== 0) return;
      ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
  }

  function applyChoice(c) {
    if (!c.analytics) deleteCookies('_ga');
    if (!c.ads) { deleteCookies('_gcl'); deleteCookies('_fbp'); deleteCookies('_fbc'); }
    gtag('consent', 'update', {
      analytics_storage: c.analytics ? 'granted' : 'denied',
      ad_storage: c.ads ? 'granted' : 'denied',
      ad_user_data: c.ads ? 'granted' : 'denied',
      ad_personalization: c.ads ? 'granted' : 'denied'
    });
    if (c.analytics || c.ads) loadGoogleTags();
    if (c.ads) loadMetaPixel();
  }

  var stored = readChoice();
  if (stored) applyChoice(stored);

  // ---- Banner -------------------------------------------------------------
  var CSS = [
    '.kw-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:640px;margin:0 auto;',
    'background:#FDFAF6;color:#1f2a26;border:1px solid #d9e4dd;border-radius:12px;',
    'box-shadow:0 8px 30px rgba(15,110,86,.15);padding:20px 22px;font-family:"DM Sans",system-ui,-apple-system,sans-serif;',
    'font-size:15px;line-height:1.5}',
    '.kw-cc h2{font-family:"Cormorant Garamond",Georgia,serif;font-size:22px;font-weight:600;margin:0 0 6px;color:#0F6E56}',
    '.kw-cc p{margin:0 0 14px}',
    '.kw-cc a{color:#0F6E56;text-decoration:underline}',
    '.kw-cc-btns{display:flex;flex-wrap:wrap;gap:10px;align-items:center}',
    '.kw-cc-btn{flex:1 1 140px;font:inherit;font-weight:600;cursor:pointer;border-radius:8px;padding:10px 16px;',
    'border:2px solid #0F6E56;background:#0F6E56;color:#fff}',
    '.kw-cc-btn:hover{filter:brightness(1.08)}',
    '.kw-cc-btn:focus-visible,.kw-cc a:focus-visible{outline:3px solid #9fd3c2;outline-offset:2px}',
    '@media (max-width:480px){.kw-cc{left:8px;right:8px;bottom:8px;padding:16px}}'
  ].join('');

  var banner = null;

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  function closeBanner() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
  }

  function decide(analytics, ads) {
    applyChoice(saveChoice(analytics, ads));
    closeBanner();
  }

  function buildBanner() {
    if (banner) return;
    if (!document.getElementById('kw-cc-style')) {
      var st = el('style', { id: 'kw-cc-style' });
      st.appendChild(document.createTextNode(CSS));
      document.head.appendChild(st);
    }

    banner = el('div', { 'class': 'kw-cc', role: 'dialog', 'aria-live': 'polite', 'aria-labelledby': 'kw-cc-title' });
    banner.innerHTML =
      '<h2 id="kw-cc-title">Cookies on our website</h2>' +
      '<p>We use essential storage to make this site work. With your permission, we would also like to use ' +
      'Google Analytics to understand how the site is used, and advertising cookies from Google and Meta to measure our adverts. ' +
      'You can change your mind at any time using the Cookie settings link at the bottom of the page. ' +
      '<a href="' + PRIVACY_URL + '">Read our privacy notice</a>.</p>' +
      '<div class="kw-cc-btns">' +
        '<button type="button" class="kw-cc-btn" id="kw-cc-reject">Reject all</button>' +
        '<button type="button" class="kw-cc-btn" id="kw-cc-accept">Accept all</button>' +
      '</div>';

    document.body.appendChild(banner);

    banner.querySelector('#kw-cc-accept').addEventListener('click', function () { decide(true, true); });
    banner.querySelector('#kw-cc-reject').addEventListener('click', function () { decide(false, false); });
  }

  // Lets the footer link reopen the banner so visitors can change their choice.
  window.kwOpenCookieSettings = function () {
    closeBanner();
    if (document.body) buildBanner();
  };

  if (!stored) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { buildBanner(); });
    } else {
      buildBanner();
    }
  }
})();
