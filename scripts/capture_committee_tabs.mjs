import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\ettel\\.gemini\\antigravity\\brain\\901cdac5-9319-4a2a-986c-782f3efc2399';

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--window-size=1440,900',
    'http://localhost:3000/donations'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((resolve, reject) => {
      http.get('http://localhost:9226/json', (res) => {
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

    // Set token & navigate
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
    await new Promise(r => setTimeout(r, 2500));

    async function capture(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(res.data, 'base64');
      fs.writeFileSync(`${ARTIFACT_DIR}\\${filename}`, buf);
      console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
    }

    // 1. Materials Tab
    console.log('Clicking Materials Tab...');
    await send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('వస్తు సమర్పణలు'))?.click();
      `
    });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_committee_materials_tab_1440.png');

    // 2. Categories Tab
    console.log('Clicking Categories Tab...');
    await send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('విరాళ విభాగాలు'))?.click();
      `
    });
    await new Promise(r => setTimeout(r, 800));
    await capture('verified_committee_categories_tab_1440.png');

    ws.close();
  } finally {
    edge.kill();
  }
}

main().catch(console.error);
