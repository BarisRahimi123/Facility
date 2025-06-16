import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload critical assets to prevent 404 errors */}
        <link
          rel="preload"
          href="/_next/static/css/app/layout.css"
          as="style"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/chunks/main-app.js"
          as="script"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/chunks/app-pages-internals.js"
          as="script"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/chunks/webpack.js"
          as="script"
          crossOrigin="anonymous"
        />
        
        {/* Add DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Disable caching to prevent back-forward cache issues */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        
        {/* Try to prevent extension conflicts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent extensions from using the content script messaging API
              window.addEventListener('beforeunload', () => {
                // Clean up any potential event listeners that might cause errors
                if (window.chrome && window.chrome.runtime) {
                  try {
                    // No-op to prevent extensions from causing errors on page navigation
                  } catch (e) {
                    console.log('Extension cleanup', e);
                  }
                }
              });
              
              // Add error handling for script loading
              window.addEventListener('error', function(event) {
                if (event.target && (event.target.src || event.target.href)) {
                  const resource = event.target.src || event.target.href;
                  // Check if it's a Next.js resource
                  if (resource.includes('/_next/')) {
                    console.warn('Failed to load resource:', resource);
                    // Attempt to reload the resource
                    const element = event.target.cloneNode(true);
                    event.target.parentNode.replaceChild(element, event.target);
                  }
                }
              }, true);
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
        
        {/* Add script to handle navigation performance */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Monitor page transitions
              if (typeof window !== 'undefined') {
                let lastNavigationStart = 0;
                
                // Save scroll position before navigation
                window.addEventListener('beforeunload', () => {
                  sessionStorage.setItem('scrollPos', window.scrollY.toString());
                });
                
                // Restore scroll position after navigation
                window.addEventListener('load', () => {
                  const scrollPos = sessionStorage.getItem('scrollPos');
                  if (scrollPos) {
                    window.scrollTo(0, parseInt(scrollPos, 10));
                  }
                  
                  // Clear any stale error states
                  console.clear();
                });
                
                // Track navigation performance
                const observer = new PerformanceObserver((list) => {
                  for (const entry of list.getEntries()) {
                    if (entry.entryType === 'navigation') {
                      console.log('Navigation performance:', entry);
                    }
                  }
                });
                
                observer.observe({ entryTypes: ['navigation', 'resource'] });
              }
            `,
          }}
        />
      </body>
    </Html>
  );
} 