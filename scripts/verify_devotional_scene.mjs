import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\ettel\\.gemini\\antigravity\\brain\\901cdac5-9319-4a2a-986c-782f3efc2399';

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--window-size=1280,900',
    'http://localhost:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((resolve, reject) => {
      http.get('http://localhost:9223/json', (res) => {
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

    // Enable console & page events
    await send('Console.enable');
    const consoleErrors = [];
    ws.addEventListener('message', (evt) => {
      const resp = JSON.parse(evt.data);
      if (resp.method === 'Console.messageAdded' && resp.params.message.level === 'error') {
        consoleErrors.push(resp.params.message.text);
      }
    });

    // 1. Desktop - Scroll position 0 (Opening Darshan)
    console.log('1. Capturing Desktop Devotional Scene at 0% scroll...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await new Promise(r => setTimeout(r, 2500));

    const shotDesktop0 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_devotional_desktop_0.png`, Buffer.from(shotDesktop0.data, 'base64'));
    console.log('Saved verified_devotional_desktop_0.png');

    // 2. Desktop - Scroll position 50%
    console.log('2. Scrolling to 50% of the scene...');
    await send('Runtime.evaluate', {
      expression: 'window.scrollTo({ top: 480, behavior: "instant" })'
    });
    await new Promise(r => setTimeout(r, 1000));
    const shotDesktop50 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_devotional_desktop_50.png`, Buffer.from(shotDesktop50.data, 'base64'));
    console.log('Saved verified_devotional_desktop_50.png');

    // 3. Desktop - Scroll to Programme Section (#today)
    console.log('3. Scrolling to Today section...');
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("today").scrollIntoView({ behavior: "instant" })'
    });
    await new Promise(r => setTimeout(r, 1000));
    const shotDesktopToday = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_devotional_desktop_today.png`, Buffer.from(shotDesktopToday.data, 'base64'));
    console.log('Saved verified_devotional_desktop_today.png');

    // 4. Test Skip Button
    console.log('4. Testing Skip Button from top...');
    await send('Runtime.evaluate', { expression: 'window.scrollTo({ top: 0, behavior: "instant" })' });
    await new Promise(r => setTimeout(r, 800));
    await send('Runtime.evaluate', {
      expression: 'document.querySelector("button[aria-label=\'కార్యక్రమాలకు వెళ్లండి\']").click()'
    });
    await new Promise(r => setTimeout(r, 1200));
    const skipScrollY = await send('Runtime.evaluate', { expression: 'window.scrollY' });
    console.log('ScrollY after clicking Skip to Programmes:', skipScrollY.result.value);

    // 5. Mobile Viewport (390x844)
    console.log('5. Capturing Mobile Devotional Scene...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send('Runtime.evaluate', { expression: 'window.scrollTo({ top: 0, behavior: "instant" })' });
    await new Promise(r => setTimeout(r, 1200));
    const shotMobile0 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_devotional_mobile_0.png`, Buffer.from(shotMobile0.data, 'base64'));
    console.log('Saved verified_devotional_mobile_0.png');

    // 6. English Switch Verification
    console.log('6. Switching to English...');
    await send('Runtime.evaluate', {
      expression: 'document.querySelector("button[aria-label=\'Switch to English\']").click()'
    });
    await new Promise(r => setTimeout(r, 1000));
    const shotEnglish = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${ARTIFACT_DIR}\\verified_devotional_english.png`, Buffer.from(shotEnglish.data, 'base64'));
    console.log('Saved verified_devotional_english.png');

    console.log('Verification completed successfully!');
    console.log('Console errors:', consoleErrors.length > 0 ? consoleErrors : 'None');

    ws.close();
  } finally {
    edge.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
