import http from 'http';
import fs from 'fs';
import { spawn } from 'child_process';

const ARTIFACT_DIR = 'C:\\Users\\ettel\\.gemini\\antigravity\\brain\\901cdac5-9319-4a2a-986c-782f3efc2399';

async function verify() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9233',
    '--window-size=1280,950',
    'http://localhost:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((resolve, reject) => {
      http.get('http://localhost:9233/json', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
    if (!pageTarget) throw new Error('Localhost target not found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(resolve => ws.onopen = resolve);

    let id = 1;
    function send(method, params = {}) {
      return new Promise(resolve => {
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

    // Capture console errors
    await send('Console.enable');
    const errors = [];
    ws.addEventListener('message', (evt) => {
      const resp = JSON.parse(evt.data);
      if (resp.method === 'Console.messageAdded' && resp.params.message.level === 'error') {
        errors.push(resp.params.message.text);
      }
    });

    // 1. Initial State: Scroll 0 (Pure Darshan)
    console.log('1. Capturing Desktop Initial State (Scroll 0)...');
    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await new Promise(r => setTimeout(r, 2000));
    const shot0 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_scene_desktop_0.png`, Buffer.from(shot0.data, 'base64'));

    // 2. Slow Scroll to 35% (Harathi Enters, Petals Showering)
    console.log('2. Slow scrolling to 35% (Harathi entry & petals)...');
    await send('Runtime.evaluate', { expression: 'window.scrollTo({ top: 380, behavior: "smooth" })' });
    await new Promise(r => setTimeout(r, 1200));
    const shot35 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_scene_desktop_35.png`, Buffer.from(shot35.data, 'base64'));

    // 3. Scroll to 60% (Offering Arc)
    console.log('3. Scrolling to 60% (Harathi offering arc)...');
    await send('Runtime.evaluate', { expression: 'window.scrollTo({ top: 650, behavior: "smooth" })' });
    await new Promise(r => setTimeout(r, 1200));
    const shot60 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_scene_desktop_60.png`, Buffer.from(shot60.data, 'base64'));

    // 4. Reverse Scrolling Test: Scroll down to 800 then slowly back to 400
    console.log('4. Reverse scroll test: from 800 back to 400...');
    await send('Runtime.evaluate', { expression: 'window.scrollTo({ top: 850, behavior: "instant" })' });
    await new Promise(r => setTimeout(r, 400));
    await send('Runtime.evaluate', { expression: 'window.scrollTo({ top: 420, behavior: "smooth" })' });
    await new Promise(r => setTimeout(r, 1200));
    const shotRev = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_scene_reverse_scroll.png`, Buffer.from(shotRev.data, 'base64'));

    // 5. Mobile Viewport (390 x 844)
    console.log('5. Mobile testing: 390x844...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send('Runtime.evaluate', { expression: 'window.scrollTo({ top: 0, behavior: "instant" })' });
    await new Promise(r => setTimeout(r, 800));
    const shotMob0 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_scene_mobile_0.png`, Buffer.from(shotMob0.data, 'base64'));

    // Mobile scroll to offering stage
    await send('Runtime.evaluate', { expression: 'window.scrollTo({ top: 320, behavior: "smooth" })' });
    await new Promise(r => setTimeout(r, 1200));
    const shotMobOffer = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_scene_mobile_offering.png`, Buffer.from(shotMobOffer.data, 'base64'));

    console.log('Verification finished! Console errors:', errors.length > 0 ? errors : 'None');

    ws.close();
  } finally {
    edge.kill();
  }
}

verify().catch(console.error);
