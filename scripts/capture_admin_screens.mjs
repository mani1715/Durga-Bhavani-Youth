import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\ettel\\.gemini\\antigravity\\brain\\901cdac5-9319-4a2a-986c-782f3efc2399';

async function main() {
  // First obtain access token from backend API
  const tokenData = await new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email: '8897557545', password: 'admin123' });
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

  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1280,1000',
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

    // Set localStorage credentials
    await send('Runtime.evaluate', {
      expression: `(() => {
        localStorage.setItem('token', '${accessToken}');
        localStorage.setItem('refreshToken', '${refreshToken}');
      })()`
    });

    // Navigate to festival management
    await send('Page.navigate', { url: 'http://localhost:3000/festival-management' });
    await new Promise(r => setTimeout(r, 2000));

    // Capture main festival management view with days and edit buttons
    const adminOverviewShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_committee_admin_overview.png`, Buffer.from(adminOverviewShot.data, 'base64'));
    console.log('Saved verified_committee_admin_overview.png');

    // Click "సవరించు" (Edit) on Day 0 to open day editing form
    await send('Runtime.evaluate', {
      expression: `(() => {
        const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('సవరించు') || b.innerText.includes('Edit'));
        if (editBtn) editBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    // Capture the day editing form dialog
    const adminEditFormShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_committee_editing_form.png`, Buffer.from(adminEditFormShot.data, 'base64'));
    console.log('Saved verified_committee_editing_form.png');

    // Close the modal and switch to settings tab to capture settings form
    await send('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.querySelector('button.text-slate-400');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));

    await send('Runtime.evaluate', {
      expression: `(() => {
        const settingsTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('సెట్టింగ్స్') || b.innerText.includes('Settings'));
        if (settingsTab) settingsTab.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    const settingsShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_committee_settings_form.png`, Buffer.from(settingsShot.data, 'base64'));
    console.log('Saved verified_committee_settings_form.png');

    ws.close();
  } catch (err) {
    console.error('Execution error:', err);
  } finally {
    edge.kill();
  }
}

main();
