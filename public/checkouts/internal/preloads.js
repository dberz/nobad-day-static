
    (function() {
      var cdnOrigin = "https://cdn.shopify.com";
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills-legacy.CxAH3j_U.js","/cdn/shopifycloud/checkout-web/assets/c1/app-legacy.D0VmKSFh.js","/cdn/shopifycloud/checkout-web/assets/c1/locale-en-legacy.Dn_2xvb6.js","/cdn/shopifycloud/checkout-web/assets/c1/page-OnePage-legacy.CfiLti4Q.js","/cdn/shopifycloud/checkout-web/assets/c1/LocalizationExtensionField-legacy.KJGCmnN3.js","/cdn/shopifycloud/checkout-web/assets/c1/RememberMeDescriptionText-legacy.B7GE_9v6.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayOptInDisclaimer-legacy.em9DZTqu.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentButtons-legacy.CzI6yd2q.js","/cdn/shopifycloud/checkout-web/assets/c1/StockProblemsLineItemList-legacy.C_lN21BB.js","/cdn/shopifycloud/checkout-web/assets/c1/DeliveryMethodSelectorSection-legacy.Ctf_qSHw.js","/cdn/shopifycloud/checkout-web/assets/c1/useEditorShopPayNavigation-legacy.CWkeqWJs.js","/cdn/shopifycloud/checkout-web/assets/c1/VaultedPayment-legacy.BzlC8zzK.js","/cdn/shopifycloud/checkout-web/assets/c1/SeparatePaymentsNotice-legacy.C9LTKlH7.js","/cdn/shopifycloud/checkout-web/assets/c1/ShipmentBreakdown-legacy.b9VGORSV.js","/cdn/shopifycloud/checkout-web/assets/c1/MerchandiseModal-legacy.C8IJnKaW.js","/cdn/shopifycloud/checkout-web/assets/c1/StackedMerchandisePreview-legacy.CHq-TfEX.js","/cdn/shopifycloud/checkout-web/assets/c1/component-ShopPayVerificationSwitch-legacy.BsuVCsla.js","/cdn/shopifycloud/checkout-web/assets/c1/useSubscribeMessenger-legacy.BxGjdzF4.js","/cdn/shopifycloud/checkout-web/assets/c1/index-legacy.CJta_R9c.js","/cdn/shopifycloud/checkout-web/assets/c1/PayButtonSection-legacy.CyRLgqiu.js"];
      var styles = [];
      var fontPreconnectUrls = [];
      var fontPrefetchUrls = [];
      var imgPrefetchUrls = ["https://cdn.shopify.com/s/files/1/0612/5502/4859/files/ExplorerHealth_Wordmark_-_Black_x320.png?v=1637612583"];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = [cdnOrigin].concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  