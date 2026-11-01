/**
 * Lighthouse CI: mobiele emulatie (standaard), 3 runs, harde budgetten.
 * De build faalt bij een categorie-score < 0.95 of bij overschrijding van de CWV-doelen.
 */
const urls = ['/', '/basiskennis/', '/basiskennis/wat-is-het-onderwerp-een-eerste-kennismaking/', '/auteurs/anna-jansen/', '/sitemap/', '/contact/'];
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: urls.map((u) => `http://localhost${u}`),
      numberOfRuns: 3,
      settings: {
        chromePath: process.env.CHROME_PATH,
        chromeFlags: '--no-sandbox --headless=new --disable-gpu --disable-dev-shm-usage',
        preset: 'perf',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'interactive': ['warn', { maxNumericValue: 3800 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
        'total-byte-weight': ['warn', { maxNumericValue: 300000 }],
        'unused-javascript': 'off',
        'uses-long-cache-ttl': 'off',
      },
    },
    upload: { target: 'filesystem', outputDir: './.lighthouseci' },
  },
};
