import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\ettel\\.gemini/antigravity/brain/901cdac5-9319-4a2a-986c-782f3efc2399';

async function testPosition() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--window-size=1024,576',
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

    // Set viewport matching user's exact laptop screen window (1024 wide, ~480 high)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1024,
      height: 480,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 600));

    // Test 1: Current state
    let res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\test_pos_current.png`, Buffer.from(res.data, 'base64'));
    console.log('Saved test_pos_current.png');

    // Test 2: Top-offsetting the image container to top: 72px / 80px and object-top
    await send('Runtime.evaluate', {
      expression: `
        const bgContainer = document.querySelector('div.-z-20');
        if (bgContainer) {
          bgContainer.style.top = '72px';
          const img = bgContainer.querySelector('img');
          if (img) {
            img.style.objectPosition = 'center 12%';
          }
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\test_pos_option2.png`, Buffer.from(res.data, 'base64'));
    console.log('Saved test_pos_option2.png');

    // Test 3: Container stays inset-0, but image is shifted down with translate or object-position: center top + pt-16
    await send('Runtime.evaluate', {
      expression: `
        const bgContainer = document.querySelector('div.-z-20');
        if (bgContainer) {
          bgContainer.style.top = '0px';
          const img = bgContainer.querySelector('img');
          if (img) {
            img.style.objectPosition = 'center top';
            img.style.transform = 'translateY(64px)';
          }
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\test_pos_option3.png`, Buffer.from(res.data, 'base64'));
    console.log('Saved test_pos_option3.png');

    // Test 4: Container top-0, object-position center 8% without transform
    await send('Runtime.evaluate', {
      expression: `
        const bgContainer = document.querySelector('div.-z-20');
        if (bgContainer) {
          bgContainer.style.top = '0px';
          const img = bgContainer.querySelector('img');
          if (img) {
            img.style.objectPosition = 'center 5%';
            img.style.transform = 'translateY(40px)';
          }
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\test_pos_option4.png`, Buffer.from(res.data, 'base64'));
    console.log('Saved test_pos_option4.png');

    ws.close();
  } finally {
    edge.kill();
  }
}

testPosition().catch(console.error);
