// Google Analytics 4 (GA4) Tracking
// Measurement ID: G-BM323918MC

(function() {
  // Load gtag.js
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-BM323918MC', {
    'page_path': window.location.pathname + window.location.search,
    'page_title': document.title
  });

  // Load the GA4 script
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-BM323918MC';
  document.head.appendChild(script);
})();

