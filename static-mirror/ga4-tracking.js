// Google Analytics 4 (GA4) Tracking
// Measurement ID: G-BM323918MC

// Initialize dataLayer
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-BM323918MC', {
  'page_path': window.location.pathname + window.location.search,
  'page_title': document.title,
  'page_location': window.location.href
});

// Track page views on navigation (for SPA-like behavior)
if (window.history && window.history.pushState) {
  var originalPushState = window.history.pushState;
  window.history.pushState = function() {
    originalPushState.apply(window.history, arguments);
    gtag('config', 'G-BM323918MC', {
      'page_path': window.location.pathname + window.location.search,
      'page_title': document.title,
      'page_location': window.location.href
    });
  };
}
