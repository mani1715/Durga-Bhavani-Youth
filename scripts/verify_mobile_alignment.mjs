import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\ettel\\.gemini\\antigravity\\brain\\901cdac5-9319-4a2a-986c-782f3efc2399';

async function verifyMobileAlignment() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--window-size=390,844',
    'http://localhost:3001/'
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

    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost:3001'));
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
          const res = JSON.parse(evt.data);
          if (res.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    // Wait 2.5 seconds for initial data fetch
    await new Promise(r => setTimeout(r, 2500));

    // Click English button
    await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const enBtn = buttons.find(b => b.textContent.trim().toLowerCase() === 'english');
        if (enBtn) enBtn.click();
      })()`
    });

    await new Promise(r => setTimeout(r, 1000));

    // 1. Capture Header in English
    const shotHeader = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_mobile_header_en_390px.png`, Buffer.from(shotHeader.data, 'base64'));
    console.log('Saved verified_mobile_header_en_390px.png');

    // 2. Scroll directly to Day 1 card in #schedule
    await send('Runtime.evaluate', {
      expression: `(() => {
        const day1Card = Array.from(document.querySelectorAll('#schedule .rounded-3xl')).find(c => c.textContent.includes('Bala Tripura') || c.textContent.includes('Day 1'));
        if (day1Card) {
          day1Card.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      })()`
    });

    await new Promise(r => setTimeout(r, 1000));

    // Capture Day 1 Card on 390px screen
    const shotCard = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_mobile_day_card_en_390px.png`, Buffer.from(shotCard.data, 'base64'));
    console.log('Saved verified_mobile_day_card_en_390px.png');

    // 3. Test on very compact 360px screen
    await send('Emulation.setDeviceMetricsOverride', {
      width: 360,
      height: 740,
      deviceScaleFactor: 2,
      mobile: true
    });

    await new Promise(r => setTimeout(r, 1000));

    const shot360 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_mobile_day_card_en_360px.png`, Buffer.from(shot360.data, 'base64'));
    console.log('Saved verified_mobile_day_card_en_360px.png');

    ws.close();
  } finally {
    edge.kill();
  }
}

verifyMobileAlignment().catch(console.error);
