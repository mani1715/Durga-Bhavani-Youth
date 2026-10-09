import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\ettel\\.gemini\\antigravity\\brain\\901cdac5-9319-4a2a-986c-782f3efc2399';

async function testHeaderAlignment() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--window-size=1366,768',
    'http://localhost:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((resolve, reject) => {
      http.get('http://localhost:9227/json', (res) => {
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

    // Set viewport 1366x650 (standard laptop screen)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 650,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 500));

    // Option 1: Current state
    let res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\test_align_current.png`, Buffer.from(res.data, 'base64'));

    // Option 2: Full width header with px-6 lg:px-8
    await send('Runtime.evaluate', {
      expression: `
        const headerDiv = document.querySelector('header > div');
        if (headerDiv) {
          headerDiv.className = 'w-full px-5 sm:px-8 lg:px-10 h-20 flex items-center justify-between gap-4';
        }
      `
    });
    await new Promise(r => setTimeout(r, 500));
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\test_align_fullwidth.png`, Buffer.from(res.data, 'base64'));

    // Option 3: max-w-[1440px] with px-6
    await send('Runtime.evaluate', {
      expression: `
        const headerDiv = document.querySelector('header > div');
        if (headerDiv) {
          headerDiv.className = 'max-w-[1440px] mx-auto px-5 sm:px-8 h-20 flex items-center justify-between gap-4';
        }
      `
    });
    await new Promise(r => setTimeout(r, 500));
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\test_align_1440.png`, Buffer.from(res.data, 'base64'));

    ws.close();
  } finally {
    edge.kill();
  }
}

testHeaderAlignment().catch(console.error);
