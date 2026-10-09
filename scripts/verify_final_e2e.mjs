import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\ettel\\.gemini\\antigravity\\brain\\901cdac5-9319-4a2a-986c-782f3efc2399';

async function getAuthToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email: 'admin@festival.com', password: 'admin123' });
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('Logging in to get access token...');
  const tokenData = await getAuthToken();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  console.log('Got token, launching Edge...');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1440,900',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2500));

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

    let msgIdCounter = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgIdCounter++;
        const handler = (evt) => {
          const resp = JSON.parse(evt.data);
          if (resp.id === id) {
            ws.removeEventListener('message', handler);
            resolve(resp.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function setViewport(width, height) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 768
      });
    }

    async function capture(filename) {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const targetPath = `${ARTIFACT_DIR}\\${filename}`;
      fs.writeFileSync(targetPath, Buffer.from(shot.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    }

    // 1. PUBLIC SITE VERIFICATION (TELUGU DEFAULT)
    console.log('\n--- 1. Public Site Verification ---');
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 2000));

    // Desktop 1440px
    await setViewport(1440, 900);
    await capture('verified_public_landing_te_1440.png');

    // Tablet 768px
    await setViewport(768, 1024);
    await capture('verified_public_landing_te_768.png');

    // Mobile 390px
    await setViewport(390, 844);
    await capture('verified_public_landing_te_390.png');

    // Mobile 360px
    await setViewport(360, 800);
    await capture('verified_public_landing_te_360.png');

    // Switch to English on Public Site
    await setViewport(1440, 900);
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('English'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));
    await capture('verified_public_landing_en_1440.png');

    // 2. RECEIPT VERIFICATION PAGE
    console.log('\n--- 2. Public Receipt Verification Page ---');
    await send('Page.navigate', { url: 'http://localhost:3000/verify' });
    await new Promise(r => setTimeout(r, 1500));
    await capture('verified_verify_receipt_page_1440.png');

    // Type receipt number #GARUVUPALEM-DURGA-BHAVANI-YOUTH-2026-000012 and click verify
    await send('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('input');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, 'GARUVUPALEM-DURGA-BHAVANI-YOUTH-2026-000012');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        setTimeout(() => {
          const btn = document.querySelector('button[type="submit"]');
          if (btn) btn.click();
        }, 300);
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));
    await capture('verified_receipt_verified_result_1440.png');

    // 3. COMMITTEE DONATIONS & BILINGUAL ENTRY
    console.log('\n--- 3. Committee Donations Page ---');
    await send('Runtime.evaluate', {
      expression: `(() => {
        localStorage.setItem('token', '${accessToken}');
        localStorage.setItem('refreshToken', '${refreshToken}');
        localStorage.setItem('festival_language', 'te');
      })()`
    });

    await send('Page.navigate', { url: 'http://localhost:3000/donations' });
    await new Promise(r => setTimeout(r, 2500));
    await capture('verified_donations_ledger_te_1440.png');

    // Open Add Donation Modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const addBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.innerText.includes('నగదు విరాళం నమోదు') || 
          b.innerText.includes('విరాళం నమోదు') ||
          b.innerText.includes('Record Cash')
        );
        if (addBtn) addBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));
    await capture('verified_donation_modal_opened_te_1440.png');

    // Type English donor name to test real-time transliteration
    console.log('Testing live transliteration typing in modal...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const enInput = inputs.find(i => i.placeholder && (i.placeholder.includes('English') || i.placeholder.includes('Ramesh') || i.placeholder.includes('రమేష్')));
        if (enInput) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(enInput, 'Venkateswara Rao');
          enInput.dispatchEvent(new Event('input', { bubbles: true }));
          enInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()`
    });
    // Wait for debounce and transliteration API
    await new Promise(r => setTimeout(r, 1500));
    await capture('verified_donation_modal_transliteration_1440.png');

    // Open inline category creator
    console.log('Testing inline + Add Category in modal...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const catBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.innerText.includes('కొత్త వర్గం') || 
          b.innerText.includes('Add Category')
        );
        if (catBtn) catBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));
    await capture('verified_donation_inline_category_1440.png');

    // Close modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('రద్దు') || b.innerText.includes('Cancel'));
        if (cancelBtn) cancelBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    // 4. OVERVIEW PAGE
    console.log('\n--- 4. Overview Page ---');
    await send('Page.navigate', { url: 'http://localhost:3000/overview' });
    await new Promise(r => setTimeout(r, 2000));
    await capture('verified_overview_te_1440.png');

    console.log('\n==========================================');
    console.log('ALL VERIFICATION SCREENSHOTS CAPTURED SUCCESSFULLY!');
    console.log('==========================================');

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    edge.kill();
  }
}

run();
