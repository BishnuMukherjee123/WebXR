import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  // Load the app and click the Bong Kebab button to load 10.glb
  await page.goto('https://localhost:5173', { waitUntil: 'networkidle2' });
  
  await page.evaluate(async () => {
    const mv = document.querySelector('model-viewer');
    if (!mv) {
      console.error("NO MODEL VIEWER FOUND");
      return;
    }
    
    // Switch to Bong Kebab
    const buttons = document.querySelectorAll('.slide');
    if (buttons.length > 1) {
      buttons[1].click(); // Bong Kebab
      console.log("Clicked Bong Kebab");
    }

    console.log("Waiting for load event...");
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error("Timeout waiting for 10.glb to load!");
        resolve(); // resolve so we don't crash
      }, 15000);
      mv.addEventListener('load', () => {
        clearTimeout(timeout);
        console.log("MODEL VIEWER LOADED 10.glb SUCCESS");
        resolve();
      });
      mv.addEventListener('error', (e) => {
        clearTimeout(timeout);
        console.error("MODEL VIEWER ERROR: ", e.detail);
        resolve();
      });
    });
  }).catch(e => console.error("EVAL ERROR:", e));
  
  await browser.close();
  process.exit(0);
})();
