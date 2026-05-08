import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('https://localhost:5173', { waitUntil: 'networkidle2' });
  
  // wait 5 seconds
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
  process.exit(0);
})();
