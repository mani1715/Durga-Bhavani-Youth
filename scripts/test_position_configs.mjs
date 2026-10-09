import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\ettel\\.gemini\\antigravity\\brain\\901cdac5-9319-4a2a-986c-782f3efc2399';

async function testPositions() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--window-size=1024,576',
    'http://localhost:3000/'
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

    // Set viewport matching user's exact screen (1024 x 480)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1024,
      height: 480,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 500));

    // Test Config A: Container top-16 md:top-20, img object-cover object-top, hero card max-w-md
    await send('Runtime.evaluate', {
      expression: `
        const bg = document.querySelector('div.-z-20');
        if (bg) {
          bg.style.top = '72px';
          const img = bg.querySelector('img');
          if (img) {
            img.style.objectPosition = 'center top';
            img.style.transform = 'none';
          }
        }
        const heroCard = document.querySelector('#hero > div');
        if (heroCard) {
          heroCard.style.maxWidth = '440px';
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));
    let res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\test_config_A.png`, Buffer.from(res.data, 'base64'));
    console.log('Saved test_config_A.png');

    // Test Config B: Container top: 0, image object-position: center 25% or translateY(50px)
    await send('Runtime.evaluate', {
      expression: `
        const bg = document.querySelector('div.-z-20');
        if (bg) {
          bg.style.top = '0px';
          const img = bg.querySelector('img');
          if (img) {
            img.style.objectPosition = 'center 15%';
            img.style.transform = 'translateY(50px)';
          }
        }
        const heroCard = document.querySelector('#hero > div');
        if (heroCard) {
          heroCard.style.maxWidth = '420px';
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\test_config_B.png`, Buffer.from(res.data, 'base64'));
    console.log('Saved test_config_B.png');

    // Test Config C: Container top: 0, image object-position: center top, translate-y 70px, hero card compact
    await send('Runtime.evaluate', {
      expression: `
        const bg = document.querySelector('div.-z-20');
        if (bg) {
          bg.style.top = '0px';
          const img = bg.querySelector('img');
          if (img) {
            img.style.objectPosition = 'center top';
            img.style.transform = 'translateY(70px)';
          }
        }
        const heroCard = document.querySelector('#hero > div');
        if (heroCard) {
          heroCard.style.maxWidth = '420px';
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\test_config_C.png`, Buffer.from(res.data, 'base64'));
    console.log('Saved test_config_C.png');

    // Now test 1440x900 on Config C
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 600));
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\test_config_C_1440.png`, Buffer.from(res.data, 'base64'));
    console.log('Saved test_config_C_1440.png');

    // Now test Mobile 390x844 on Config C
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true
    });
    // On mobile, transform can be smaller or object-position: center 15%
    await send('Runtime.evaluate', {
      expression: `
        const bg = document.querySelector('div.-z-20');
        if (bg) {
          const img = bg.querySelector('img');
          if (img) {
            img.style.objectPosition = 'center 12%';
            img.style.transform = 'translateY(20px)';
          }
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));
    res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\test_config_C_mobile.png`, Buffer.from(res.data, 'base64'));
    console.log('Saved test_config_C_mobile.png');

    ws.close();
  } finally {
    edge.kill();
  }
}

testPositions().catch(console.error);
