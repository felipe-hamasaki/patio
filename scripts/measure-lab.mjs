import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// One unthrottled local sample per viewport; this does not measure field Core Web Vitals.
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
const samples = [];
try {
  for (const [device, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile-viewport', 390, 844],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      window.__patioLab = { lcp: null, cls: 0, longTasks: [] };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__patioLab.lcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (!entry.hadRecentInput) window.__patioLab.cls += entry.value;
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__patioLab.longTasks.push(entry.duration);
      }).observe({ type: 'longtask', buffered: true });
    });
    const response = await page.goto('http://127.0.0.1:3002/demo', { waitUntil: 'networkidle' });
    await page.locator('.order-card').first().waitFor();
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      return {
        ...window.__patioLab,
        fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        domContentLoaded: navigation.domContentLoadedEventEnd,
        jsEncodedBytes: resources
          .filter((r) => r.name.includes('.js'))
          .reduce((n, r) => n + r.encodedBodySize, 0),
        totalTransferBytes: resources.reduce((n, r) => n + r.transferSize, navigation.transferSize),
        requests: resources.length + 1,
        externalRequests: resources
          .filter((r) => new URL(r.name).origin !== location.origin)
          .map((r) => r.name),
      };
    });
    const headers = response.headers();
    samples.push({
      device,
      viewport: { width, height },
      browser: browser.version(),
      metrics,
      errors,
      securityHeaders: Object.fromEntries(
        [
          'content-security-policy',
          'x-content-type-options',
          'referrer-policy',
          'x-frame-options',
          'permissions-policy',
        ].map((key) => [key, headers[key]]),
      ),
    });
    await context.close();
  }
} finally {
  await browser.close();
}
await mkdir('docs', { recursive: true });
await writeFile(
  'docs/lab-metrics.json',
  JSON.stringify(
    {
      recordedAt: new Date().toISOString(),
      environment:
        'Windows, Edge headless, next start, loopback; no CPU/network throttling; fresh contexts; one sample per viewport; CLS is the sum of observed shifts over this short load; not INP or field p75',
      samples,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify(
    samples.map((s) => ({ device: s.device, ...s.metrics, errors: s.errors })),
    null,
    2,
  ),
);
