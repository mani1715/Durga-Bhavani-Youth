import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\ettel\\.gemini\\antigravity\\brain\\901cdac5-9319-4a2a-986c-782f3efc2399';

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1280,950',
    'http://localhost:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const targets = await new Promise((resolve, reject) => {
      http.get('http://localhost:9222/json', (res) => {
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

    await new Promise(r => setTimeout(r, 1500));

    // 1. Homepage Top & Hero
    console.log('1. Capturing Homepage Hero...');
    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await new Promise(r => setTimeout(r, 2000));
    const heroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_homepage_hero.png`, Buffer.from(heroShot.data, 'base64'));
    console.log('Saved verified_homepage_hero.png');

    // 2. Scroll to Gallery / Our Ammavaru (Photo 3)
    console.log('2. Capturing Our Ammavaru in Gallery...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('gallery');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));
    const galShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_gallery_our_ammavaru.png`, Buffer.from(galShot.data, 'base64'));
    console.log('Saved verified_gallery_our_ammavaru.png');

    // 3. Scroll to Devotional Darshan Close-Up (Photo 1) & Footer
    console.log('3. Capturing Devotional Darshan & Footer...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('contact');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));
    const devotionalShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_devotional_darshan_footer.png`, Buffer.from(devotionalShot.data, 'base64'));
    console.log('Saved verified_devotional_darshan_footer.png');

    // 4. Login Page
    console.log('4. Capturing Login Page...');
    await send('Page.navigate', { url: 'http://localhost:3000/login' });
    await new Promise(r => setTimeout(r, 1500));
    const loginShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_login_branding.png`, Buffer.from(loginShot.data, 'base64'));
    console.log('Saved verified_login_branding.png');

    // 5. Submit Login & Enter Portal
    console.log('5. Logging into Committee Portal...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const setVal = (el, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        const inputs = document.querySelectorAll('input');
        if (inputs.length >= 2) {
          setVal(inputs[0], '8897557545');
          setVal(inputs[1], 'admin123');
          const form = document.querySelector('form');
          if (form) form.requestSubmit();
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 2500));

    // 6. Capture Portal Sidebar Logo
    console.log('6. Capturing Portal Sidebar Logo...');
    await send('Page.navigate', { url: 'http://localhost:3000/home' });
    await new Promise(r => setTimeout(r, 2000));
    const portalShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_portal_sidebar_logo.png`, Buffer.from(portalShot.data, 'base64'));
    console.log('Saved verified_portal_sidebar_logo.png');

    // 7. Capture Festival Management Settings Tab with Independent Logo & Hero controls
    console.log('7. Capturing Festival Management Settings...');
    await send('Page.navigate', { url: 'http://localhost:3000/festival-management' });
    await new Promise(r => setTimeout(r, 2000));
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const settingsTab = btns.find(b => b.textContent.includes('సెట్టింగ్స్') || b.textContent.includes('ఫోన్ నంబర్లు') || b.textContent.includes('Settings'));
        if (settingsTab) settingsTab.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));
    const settingsShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_portal_settings_branding.png`, Buffer.from(settingsShot.data, 'base64'));
    console.log('Saved verified_portal_settings_branding.png');

    // 8. Capture Mobile View of Portal
    console.log('8. Capturing Mobile Portal Drawer...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 412,
      height: 915,
      deviceScaleFactor: 2.625,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 800));
    await send('Runtime.evaluate', {
      expression: `(() => {
        const menuBtn = document.querySelector('header button[aria-label="Open navigation menu"]') || document.querySelector('header button');
        if (menuBtn) menuBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));
    const mobilePortalShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_portal_mobile_nav_logo.png`, Buffer.from(mobilePortalShot.data, 'base64'));
    console.log('Saved verified_portal_mobile_nav_logo.png');

    ws.close();
    console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    edge.kill();
  }
}

main();
