import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\ettel\\.gemini\\antigravity\\brain\\901cdac5-9319-4a2a-986c-782f3efc2399';

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--window-size=1440,900',
    'http://localhost:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((resolve, reject) => {
      http.get('http://localhost:9224/json', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
    if (!pageTarget) throw new Error('Page target not found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        const handler = (evt) => {
          const resp = JSON.parse(evt.data);
          if (resp.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(resp.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    const consoleErrors = [];
    await send('Console.enable');
    ws.addEventListener('message', (evt) => {
      const resp = JSON.parse(evt.data);
      if (resp.method === 'Console.messageAdded' && resp.params?.message?.level === 'error') {
        consoleErrors.push(resp.params.message.text);
      }
    });

    // Helper: set viewport
    async function setViewport(width, height, isMobile = false) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: isMobile
      });
      await new Promise(r => setTimeout(r, 600));
    }

    // Helper: take screenshot
    async function capture(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(res.data, 'base64');
      fs.writeFileSync(`${ARTIFACT_DIR}\\${filename}`, buf);
      console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
    }

    // 1. Desktop 1440x900 (Telugu default)
    console.log('Testing Desktop 1440x900 Telugu...');
    await setViewport(1440, 900);
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 1000));
    await capture('verified_shrine_desktop_hero.png');

    // Scroll to #today
    await send('Runtime.evaluate', { expression: "document.querySelector('#today')?.scrollIntoView({ behavior: 'instant' });" });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_shrine_desktop_today.png');

    // Scroll to #donations
    await send('Runtime.evaluate', { expression: "document.querySelector('#donations')?.scrollIntoView({ behavior: 'instant' });" });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_shrine_desktop_donations.png');

    // 2. Compact Desktop 1024x768
    console.log('Testing Compact Desktop 1024x768...');
    await setViewport(1024, 768);
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_shrine_compact_desktop_hero.png');

    // 3. Tablet 768x1024
    console.log('Testing Tablet 768x1024...');
    await setViewport(768, 1024);
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_shrine_tablet_hero.png');

    // 4. Mobile 390x844
    console.log('Testing Mobile 390x844...');
    await setViewport(390, 844, true);
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 1000));
    await capture('verified_shrine_mobile_hero.png');

    // Test mobile menu open
    await send('Runtime.evaluate', { expression: "document.querySelector('header button[aria-label=\"Toggle navigation menu\"]')?.click();" });
    await new Promise(r => setTimeout(r, 500));
    await capture('verified_shrine_mobile_menu.png');
    // Close menu
    await send('Runtime.evaluate', { expression: "document.querySelector('header button[aria-label=\"Toggle navigation menu\"]')?.click();" });
    await new Promise(r => setTimeout(r, 300));

    // Scroll down on mobile to #today
    await send('Runtime.evaluate', { expression: "document.querySelector('#today')?.scrollIntoView({ behavior: 'instant' });" });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_shrine_mobile_today.png');

    // 5. English switch test on Desktop 1440x900
    console.log('Testing English switch on Desktop 1440x900...');
    await setViewport(1440, 900);
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await send('Runtime.evaluate', { expression: "document.querySelector('header button[aria-label=\"Switch to English\"]')?.click();" });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_shrine_desktop_english.png');

    // Check header nav items on English desktop
    const navText = await send('Runtime.evaluate', {
      expression: "Array.from(document.querySelectorAll('header nav a')).map(a => a.textContent)"
    });
    console.log('English Nav Items:', navText.result.value);

    // Check canvas petals
    const canvasExists = await send('Runtime.evaluate', {
      expression: "Boolean(document.querySelector('canvas'))"
    });
    console.log('Canvas Petals Overlay Present:', canvasExists.result.value);

    // Check background image loading status
    const bgLoaded = await send('Runtime.evaluate', {
      expression: "Boolean(document.querySelector('img[src=\"/ammavaru-golden-shrine.jpg\"]')?.complete)"
    });
    console.log('Background Image Loaded:', bgLoaded.result.value);

    // Switch back to Telugu default for clean state
    await send('Runtime.evaluate', { expression: "document.querySelector('header button[aria-label=\"Switch to Telugu\"]')?.click();" });
    await new Promise(r => setTimeout(r, 500));

    console.log('Console errors encountered:', consoleErrors.length, consoleErrors);

    ws.close();
  } finally {
    edge.kill();
  }
}

main().catch(console.error);
