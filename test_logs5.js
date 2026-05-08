import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  
  await page.goto('https://localhost:5173', { waitUntil: 'networkidle2' });
  
  // Wait for model-viewer to load Astronaut
  await page.evaluate(async () => {
    const mv = document.querySelector('model-viewer');
    await new Promise((resolve) => mv.addEventListener('load', resolve, { once: true }));
  });

  // Take screenshot of Astronaut
  await page.screenshot({ path: 'screenshot_astronaut.png' });

  // Click Bong Kebab
  await page.evaluate(async () => {
    const buttons = document.querySelectorAll('.slide');
    if (buttons.length > 1) {
      buttons[1].click(); // Bong Kebab
    }
  });

  // Wait for load event
  await page.evaluate(async () => {
    const mv = document.querySelector('model-viewer');
    await new Promise((resolve) => mv.addEventListener('load', resolve, { once: true }));
  });

  // Wait a little extra time for rendering
  await new Promise(r => setTimeout(r, 2000));

  // Take screenshot of Bong Kebab
  await page.screenshot({ path: 'screenshot_kebab.png' });
  
  await browser.close();
  process.exit(0);
})();
