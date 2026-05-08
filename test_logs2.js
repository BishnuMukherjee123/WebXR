import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('https://localhost:5173', { waitUntil: 'networkidle2' });
  
  await page.evaluate(async () => {
    const mv = document.querySelector('model-viewer');
    if (!mv) {
      console.error("NO MODEL VIEWER FOUND");
      return;
    }
    
    console.log("ModelViewer found. waiting for load event...");
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject("Timeout waiting for load"), 15000);
      mv.addEventListener('load', () => {
        clearTimeout(timeout);
        console.log("MODEL VIEWER LOADED SUCCESS");
        resolve();
      });
      mv.addEventListener('error', (e) => {
        clearTimeout(timeout);
        console.error("MODEL VIEWER ERROR: ", e.detail);
        reject("Model viewer error");
      });
    });
  }).catch(e => console.error("EVAL ERROR:", e));
  
  await browser.close();
  process.exit(0);
})();
