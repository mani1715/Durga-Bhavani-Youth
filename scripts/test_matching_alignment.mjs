import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\ettel\\.gemini\\antigravity\\brain\\901cdac5-9319-4a2a-986c-782f3efc2399';

async function testMatchingAlignment() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--window-size=1366,768',
    'http://localhost:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((resolve, reject) => {
      http.get('http://localhost:9228/json', (res) => {
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

    // Test on 1366x650 laptop
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 650,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 500));

    // Align header & hero with px-6 sm:px-8 lg:px-12
    await send('Runtime.evaluate', {
      expression: `
        const headerDiv = document.querySelector('header > div');
        if (headerDiv) {
          headerDiv.className = 'w-full px-5 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-4';
        }
        const heroSection = document.querySelector('#hero');
        if (heroSection) {
          heroSection.className = 'relative z-10 min-h-[85svh] md:min-h-[88svh] flex flex-col justify-end md:justify-center items-start px-5 sm:px-8 lg:px-12 py-8 sm:py-12 w-full max-w-[1440px] mx-auto scroll-mt-24';
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));
    let res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\test_perfect_left_alignment_1366.png`, Buffer.from(res.data, 'base64'));

    // Test on 1024x576 (matching user's screen)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1024,
      height: 480,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 500));
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\test_perfect_left_alignment_1024.png`, Buffer.from(res.data, 'base64'));

    ws.close();
  } finally {
    edge.kill();
  }
}

testMatchingAlignment().catch(console.error);
