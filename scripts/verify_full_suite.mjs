import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\ettel\\.gemini\\antigravity\\brain\\901cdac5-9319-4a2a-986c-782f3efc2399';

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--window-size=1440,900',
    'http://localhost:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((resolve, reject) => {
      http.get('http://localhost:9225/json', (res) => {
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

    async function setViewport(width, height, isMobile = false) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: isMobile
      });
      await new Promise(r => setTimeout(r, 600));
    }

    async function capture(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(res.data, 'base64');
      fs.writeFileSync(`${ARTIFACT_DIR}\\${filename}`, buf);
      console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
    }

    // 1. Desktop 1440x900 Telugu
    console.log('Capturing Desktop 1440x900 Telugu Hero...');
    await setViewport(1440, 900);
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 1200));
    await capture('verified_hero_4elements_1440.png');

    console.log('Capturing Desktop 1440x900 Today Programme Preview...');
    await send('Runtime.evaluate', { expression: "document.querySelector('#today')?.scrollIntoView({ behavior: 'instant' });" });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_today_upcoming_preview_1440.png');

    console.log('Capturing Desktop 1440x900 Enhanced Donations Section...');
    await send('Runtime.evaluate', { expression: "document.querySelector('#donations')?.scrollIntoView({ behavior: 'instant' });" });
    await new Promise(r => setTimeout(r, 1000));
    await capture('verified_donations_highest_metrics_1440.png');

    // 2. Desktop 1440x900 English
    console.log('Capturing Desktop 1440x900 English Hero...');
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await send('Runtime.evaluate', { expression: "document.querySelector('header button[aria-label=\"Switch to English\"]')?.click();" });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_hero_english_1440.png');

    // Switch back to Telugu default
    await send('Runtime.evaluate', { expression: "document.querySelector('header button[aria-label=\"Switch to Telugu\"]')?.click();" });
    await new Promise(r => setTimeout(r, 500));

    // 3. Compact Desktop 1024x768
    console.log('Capturing Compact Desktop 1024x768...');
    await setViewport(1024, 768);
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_hero_compact_1024.png');

    // 4. Tablet 768x1024
    console.log('Capturing Tablet 768x1024...');
    await setViewport(768, 1024);
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_hero_tablet_768.png');

    // 5. Mobile 390x844
    console.log('Capturing Mobile 390x844 Hero...');
    await setViewport(390, 844, true);
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 1000));
    await capture('verified_hero_mobile_390.png');

    console.log('Capturing Mobile 390x844 Drawer Menu...');
    await send('Runtime.evaluate', { expression: "document.querySelector('header button[aria-label=\"Toggle navigation menu\"]')?.click();" });
    await new Promise(r => setTimeout(r, 500));
    await capture('verified_menu_mobile_390.png');
    await send('Runtime.evaluate', { expression: "document.querySelector('header button[aria-label=\"Toggle navigation menu\"]')?.click();" });
    await new Promise(r => setTimeout(r, 400));

    console.log('Capturing Mobile 390x844 Donations Cards View...');
    await send('Runtime.evaluate', { expression: "document.querySelector('#donations')?.scrollIntoView({ behavior: 'instant' });" });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_donations_mobile_cards_390.png');

    // 6. Mobile 360x780 (Android standard)
    console.log('Capturing Mobile 360x780 Hero...');
    await setViewport(360, 780, true);
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_hero_mobile_360.png');

    // 7. Committee Portal /donations
    console.log('Capturing Committee Portal /donations...');
    await setViewport(1440, 900, false);
    // Login with credentials in localStorage
    await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const resp = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: 'admin@festival.com', password: 'admin123'})
          });
          const data = await resp.json();
          localStorage.setItem('auth_token', data.access_token);
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('access_token', data.access_token);
          window.location.href = '/donations';
        })()
      `,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 2000));
    await capture('verified_committee_donations_ledger_1440.png');

    // Switch to Materials tab in Committee Portal
    console.log('Capturing Committee Portal Materials Tab...');
    await send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('వస్తువులు & సేవలు') || b.textContent.includes('Materials'))?.click();
      `
    });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_committee_donations_materials_1440.png');

    // Switch to Categories tab in Committee Portal
    console.log('Capturing Committee Portal Categories Tab...');
    await send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('కేటగిరీలు') || b.textContent.includes('Categories'))?.click();
      `
    });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_committee_donations_categories_1440.png');

    console.log('All verification screenshots captured successfully!');
    console.log('Console errors encountered:', consoleErrors.length, consoleErrors);

    ws.close();
  } finally {
    edge.kill();
  }
}

main().catch(console.error);
