import http from 'http';
import fs from 'fs';
import { spawn } from 'child_process';

const OUT_PATH = 'C:\\my projects\\Vinayaka chavithi\\frontend\\public\\assets\\devotional\\flame.webm';

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9229',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const targets = await new Promise((resolve, reject) => {
      http.get('http://localhost:9229/json', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const pageTarget = targets.find(t => t.type === 'page');
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

    console.log('Rendering 5-second realistic camphor flame video (480x720, 30fps)...');
    
    // Inject canvas rendering and MediaRecorder
    const renderScript = `
    (async () => {
      const width = 480;
      const height = 720;
      const fps = 30;
      const durationSec = 5.0;
      const totalFrames = Math.round(fps * durationSec);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8',
        videoBitsPerSecond: 2500000
      });

      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      const finishedPromise = new Promise(resolve => {
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(blob);
        };
      });

      recorder.start();

      // Flame simulation parameters:
      // Base anchored at bottom center: (width/2 = 240, height - 140 = 580)
      const baseX = width / 2;
      const baseY = height - 150;

      // Deterministic periodic flame flicker functions (seamless loop over 5 seconds)
      const twoPi = Math.PI * 2;
      function loopOsc(frame, periodSec, phase = 0) {
        // Must complete an integer number of cycles in durationSec (5.0s)
        const cycles = Math.max(1, Math.round(durationSec / periodSec));
        return Math.sin((frame / totalFrames) * cycles * twoPi + phase);
      }

      for (let f = 0; f < totalFrames; f++) {
        // Pure uniform black background (#000000)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Height variation (subtle, 180 to 220px)
        const hNoise = loopOsc(f, 1.25) * 12 + loopOsc(f, 0.5, 0.7) * 7 + loopOsc(f, 0.25, 1.4) * 4;
        const flameHeight = 195 + hNoise;
        
        // Width variation (subtle, 45 to 60px)
        const wNoise = loopOsc(f, 1.0, 0.3) * 4 + loopOsc(f, 0.4, 1.1) * 2.5;
        const flameWidth = 52 + wNoise;

        // Subtle tip waver (anchored base doesn't move, tip wavers slightly)
        const tipWaver = loopOsc(f, 1.67, 0.5) * 8 + loopOsc(f, 0.71, 1.8) * 4 + loopOsc(f, 0.33, 0.2) * 2;
        const tipX = baseX + tipWaver;
        const tipY = baseY - flameHeight;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // 1. Soft Outer Amber/Orange Glow (Subtle, no exaggerated cloud)
        const outerGlow = ctx.createRadialGradient(baseX, baseY - flameHeight * 0.4, flameWidth * 0.2, baseX, baseY - flameHeight * 0.45, flameWidth * 2.2);
        outerGlow.addColorStop(0, 'rgba(235, 120, 20, 0.45)');
        outerGlow.addColorStop(0.5, 'rgba(180, 70, 10, 0.18)');
        outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.ellipse(baseX, baseY - flameHeight * 0.45, flameWidth * 1.8, flameHeight * 0.7, 0, 0, twoPi);
        ctx.fill();

        // 2. Outer Flame Body (Teardrop curve from fixed base to flickering tip)
        ctx.beginPath();
        ctx.moveTo(baseX - flameWidth * 0.5, baseY);
        // Left curve
        ctx.bezierCurveTo(
          baseX - flameWidth * 0.9, baseY - flameHeight * 0.35,
          baseX - flameWidth * 0.4 + tipWaver * 0.5, baseY - flameHeight * 0.75,
          tipX, tipY
        );
        // Right curve
        ctx.bezierCurveTo(
          baseX + flameWidth * 0.4 + tipWaver * 0.5, baseY - flameHeight * 0.75,
          baseX + flameWidth * 0.9, baseY - flameHeight * 0.35,
          baseX + flameWidth * 0.5, baseY
        );
        ctx.closePath();

        const bodyGrad = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
        bodyGrad.addColorStop(0, 'rgba(255, 130, 20, 0.9)');
        bodyGrad.addColorStop(0.4, 'rgba(255, 170, 30, 0.95)');
        bodyGrad.addColorStop(0.8, 'rgba(255, 110, 15, 0.85)');
        bodyGrad.addColorStop(1, 'rgba(220, 60, 5, 0)');
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // 3. Inner Warm Yellow-White Core
        const coreWidth = flameWidth * 0.58;
        const coreHeight = flameHeight * 0.72;
        const coreTipX = baseX + tipWaver * 0.6;
        const coreTipY = baseY - coreHeight;

        ctx.beginPath();
        ctx.moveTo(baseX - coreWidth * 0.5, baseY);
        ctx.bezierCurveTo(
          baseX - coreWidth * 0.85, baseY - coreHeight * 0.4,
          baseX - coreWidth * 0.3 + tipWaver * 0.4, baseY - coreHeight * 0.8,
          coreTipX, coreTipY
        );
        ctx.bezierCurveTo(
          baseX + coreWidth * 0.3 + tipWaver * 0.4, baseY - coreHeight * 0.8,
          baseX + coreWidth * 0.85, baseY - coreHeight * 0.4,
          baseX + coreWidth * 0.5, baseY
        );
        ctx.closePath();

        const coreGrad = ctx.createLinearGradient(baseX, baseY, coreTipX, coreTipY);
        coreGrad.addColorStop(0, 'rgba(255, 235, 170, 0.98)');
        coreGrad.addColorStop(0.5, 'rgba(255, 255, 210, 1.0)');
        coreGrad.addColorStop(0.85, 'rgba(255, 215, 110, 0.9)');
        coreGrad.addColorStop(1, 'rgba(255, 160, 30, 0)');
        ctx.fillStyle = coreGrad;
        ctx.fill();

        // 4. White-Hot Incandescent Center Centerline
        const hotWidth = coreWidth * 0.4;
        const hotHeight = coreHeight * 0.58;
        ctx.beginPath();
        ctx.moveTo(baseX - hotWidth * 0.5, baseY);
        ctx.bezierCurveTo(
          baseX - hotWidth * 0.7, baseY - hotHeight * 0.4,
          baseX - hotWidth * 0.2, baseY - hotHeight * 0.8,
          baseX + tipWaver * 0.3, baseY - hotHeight
        );
        ctx.bezierCurveTo(
          baseX + hotWidth * 0.2, baseY - hotHeight * 0.8,
          baseX + hotWidth * 0.7, baseY - hotHeight * 0.4,
          baseX + hotWidth * 0.5, baseY
        );
        ctx.closePath();

        const hotGrad = ctx.createLinearGradient(baseX, baseY, baseX, baseY - hotHeight);
        hotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        hotGrad.addColorStop(0.6, 'rgba(255, 255, 240, 0.95)');
        hotGrad.addColorStop(1, 'rgba(255, 230, 150, 0)');
        ctx.fillStyle = hotGrad;
        ctx.fill();

        // 5. Classic Camphor Flame Blue Base (Small, distinct, anchored at the very bottom)
        const blueGrad = ctx.createRadialGradient(baseX, baseY - 4, 2, baseX, baseY - 6, flameWidth * 0.65);
        blueGrad.addColorStop(0, 'rgba(100, 175, 255, 0.85)');
        blueGrad.addColorStop(0.45, 'rgba(40, 110, 240, 0.65)');
        blueGrad.addColorStop(0.75, 'rgba(20, 60, 200, 0.25)');
        blueGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = blueGrad;
        ctx.beginPath();
        ctx.ellipse(baseX, baseY - 4, flameWidth * 0.55, 18, 0, 0, twoPi);
        ctx.fill();

        ctx.restore();

        // Pace at 30 fps
        await new Promise(r => setTimeout(r, 1000 / fps));
      }

      recorder.stop();
      return await finishedPromise;
    })()
    `;

    const result = await send('Runtime.evaluate', {
      expression: renderScript,
      awaitPromise: true
    });

    if (result.exceptionDetails) {
      console.error('Exception during render:', result.exceptionDetails);
    } else {
      const base64Data = result.result.value;
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(OUT_PATH, buffer);
      console.log(`Successfully generated flame video: ${OUT_PATH} (${buffer.length} bytes)`);
    }

    ws.close();
  } finally {
    edge.kill();
  }
}

main().catch(console.error);
