import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\ettel\\.gemini\\antigravity\\brain\\901cdac5-9319-4a2a-986c-782f3efc2399';

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1280,900',
    'http://localhost:3000'
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

    // Wait for fonts & data
    await new Promise(r => setTimeout(r, 2000));

    // Check computed styles on homepage
    const computedCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const h1 = document.querySelector('h1.text-main-title') || document.querySelector('h1');
        const h2 = document.querySelector('h2');
        const p = document.querySelector('p');
        const btn = document.querySelector('button, a[href="#donations"]');
        
        const getStyles = (el) => {
          if (!el) return null;
          const s = window.getComputedStyle(el);
          return {
            fontFamily: s.fontFamily,
            fontWeight: s.fontWeight,
            fontSize: s.fontSize,
            lineHeight: s.lineHeight,
            letterSpacing: s.letterSpacing
          };
        };

        return {
          h1: getStyles(h1),
          h2: getStyles(h2),
          p: getStyles(p),
          btn: getStyles(btn)
        };
      })()`,
      returnByValue: true
    });

    console.log('Computed styles check on Homepage:', JSON.stringify(computedCheck.value, null, 2));

    // 1. Homepage desktop screenshot
    const homeShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_homepage_desktop.png`, Buffer.from(homeShot.data, 'base64'));
    console.log('1. Saved verified_homepage_desktop.png');

    // 2. Open Programme Details Modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('వివరాలు') || b.innerText.includes('View'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    const modalShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_programme_details.png`, Buffer.from(modalShot.data, 'base64'));
    console.log('2. Saved verified_programme_details.png');

    // Close modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('మూసివేయి') || b.innerText.includes('Close') || b.getAttribute('aria-label') === 'Close dialog');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    // 3. Scroll to Donations Section
    await send('Runtime.evaluate', {
      expression: `(() => {
        const donationsSec = document.getElementById('donations');
        if (donationsSec) donationsSec.scrollIntoView({ behavior: 'instant' });
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    const donationsShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_donations_list.png`, Buffer.from(donationsShot.data, 'base64'));
    console.log('3. Saved verified_donations_list.png');

    // 4. Navigate to Login and Log in to Committee Admin
    await send('Page.navigate', { url: 'http://localhost:3000/login' });
    await new Promise(r => setTimeout(r, 1500));

    // Fill in credentials and submit
    await send('Runtime.evaluate', {
      expression: `(async () => {
        const inputs = document.querySelectorAll('input');
        if (inputs.length >= 2) {
          inputs[0].value = '8897557545';
          inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          inputs[1].value = 'admin123';
          inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
          const form = document.querySelector('form');
          if (form) form.requestSubmit();
        }
      })()`
    });

    // Wait for login redirect
    await new Promise(r => setTimeout(r, 2000));

    // Navigate to festival-management
    await send('Page.navigate', { url: 'http://localhost:3000/festival-management' });
    await new Promise(r => setTimeout(r, 2000));

    // Open Settings tab in Festival Management
    await send('Runtime.evaluate', {
      expression: `(() => {
        const settingsTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('సెట్టింగ్స్') || b.innerText.includes('Settings'));
        if (settingsTab) settingsTab.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    const adminShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_committee_editing_form.png`, Buffer.from(adminShot.data, 'base64'));
    console.log('4. Saved verified_committee_editing_form.png');

    ws.close();
  } catch (err) {
    console.error('Execution error:', err);
  } finally {
    edge.kill();
  }
}

main();
