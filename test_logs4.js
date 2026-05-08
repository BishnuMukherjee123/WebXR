import fs from 'fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Node.js doesn't have a DOM, so we can't easily run GLTFLoader without jsdom or relying on Puppeteer.
// I will just use puppeteer to print the bounding box of 10.glb!
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('https://localhost:5173', { waitUntil: 'networkidle2' });
  
  await page.evaluate(async () => {
    const mv = document.querySelector('model-viewer');
    
    const buttons = document.querySelectorAll('.slide');
    if (buttons.length > 1) {
      buttons[1].click(); // Bong Kebab
    }

    await new Promise((resolve) => {
      mv.addEventListener('load', () => resolve());
    });

      const size = mv.getDimensions();
      console.log("MV API DIMENSIONS:", size.x, size.y, size.z);
      const center = mv.getCameraTarget();
      console.log("MV API TARGET:", center.x, center.y, center.z);
  });
  
  await browser.close();
  process.exit(0);
})();
