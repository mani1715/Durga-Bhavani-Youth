import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=412,915',
    'http://localhost:3000'
  ]);

  // wait 2s for edge to start
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
    if (!pageTarget) {
      console.log('No page target found:', targets);
      return;
    }

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

    // Wait 1.5s for fonts and data
    await new Promise(r => setTimeout(r, 1500));

    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.offsetWidth;
        const bodyWidth = document.body.offsetWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const overflowing = [];
        document.querySelectorAll('*').forEach(el => {
          if (el.scrollWidth > window.innerWidth) {
            overflowing.push({
              tag: el.tagName,
              className: el.className,
              id: el.id,
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
              text: el.innerText ? el.innerText.substring(0, 40) : ''
            });
          }
        });

        const h1 = document.querySelector('h1.text-main-title') || document.querySelector('h1');
        const h1Styles = h1 ? window.getComputedStyle(h1) : null;

        return {
          windowWidth: window.innerWidth,
          docWidth,
          bodyWidth,
          scrollWidth,
          overflowCount: overflowing.length,
          overflowing: overflowing.slice(0, 10),
          h1: h1Styles ? {
            fontFamily: h1Styles.fontFamily,
            fontWeight: h1Styles.fontWeight,
            fontSize: h1Styles.fontSize,
            lineHeight: h1Styles.lineHeight,
            letterSpacing: h1Styles.letterSpacing,
            text: h1.innerText,
            offsetWidth: h1.offsetWidth,
            scrollWidth: h1.scrollWidth
          } : null
        };
      })()`,
      returnByValue: true
    });

    console.log('Inspection result:', JSON.stringify(evalResult.value, null, 2));

    // Capture mobile screenshot
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\ettel\\.gemini\\antigravity\\brain\\901cdac5-9319-4a2a-986c-782f3efc2399\\homepage_mobile_clean.png', Buffer.from(screenshot.data, 'base64'));
    console.log('Saved homepage_mobile_clean.png');

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    edge.kill();
  }
}

run();
