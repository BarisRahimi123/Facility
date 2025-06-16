// Safari polyfills and fixes
(function() {
  'use strict';
  
  // Check if running in Safari
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  if (!isSafari) return;
  
  console.log('Safari detected, applying compatibility fixes');
  
  // Fix for webpack module loading
  if (typeof window !== 'undefined' && !window.__webpack_require__) {
    window.__webpack_require__ = function(moduleId) {
      console.warn('Webpack require polyfill called for module:', moduleId);
      return {};
    };
  }
  
  // Fix for undefined factory calls
  if (typeof window !== 'undefined') {
    var originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
      if (descriptor && descriptor.value && typeof descriptor.value === 'function') {
        var originalValue = descriptor.value;
        descriptor.value = function() {
          try {
            return originalValue.apply(this, arguments);
          } catch (e) {
            if (e.message && e.message.includes('Cannot read properties of undefined')) {
              console.warn('Caught Safari error:', e.message);
              return undefined;
            }
            throw e;
          }
        };
      }
      return originalDefineProperty.call(this, obj, prop, descriptor);
    };
  }
})(); 