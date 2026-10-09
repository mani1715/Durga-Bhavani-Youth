import React, { useEffect, useRef } from 'react';

export const DevotionalPetalsOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Accessibility check: reduced motion disables petals simulation
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isTabVisible = !document.hidden;

    // Sprite loading for all 8 authentic petal assets
    const spriteUrls = [
      '/assets/devotional/petals/rose-1.webp',
      '/assets/devotional/petals/rose-2.webp',
      '/assets/devotional/petals/rose-3.webp',
      '/assets/devotional/petals/rose-4.webp',
      '/assets/devotional/petals/marigold-1.webp',
      '/assets/devotional/petals/marigold-2.webp',
      '/assets/devotional/petals/marigold-3.webp',
      '/assets/devotional/petals/marigold-4.webp',
    ];

    const loadedSprites: HTMLImageElement[] = [];
    spriteUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        if (img.naturalWidth > 0) loadedSprites.push(img);
      };
    });

    // Resize handling with device pixel ratio clamp
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Track scroll activity to smoothly modulate petal emission
    let scrollVelocity = 0;
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();

    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastScrollTime);
      const dy = Math.abs(window.scrollY - lastScrollY);
      // Increase scroll velocity boost (capped)
      scrollVelocity = Math.min(1.0, scrollVelocity + (dy / dt) * 0.25);
      lastScrollY = window.scrollY;
      lastScrollTime = now;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Petal particle interface
    interface Petal {
      x: number;
      baseX: number;
      y: number;
      size: number;
      vy: number;
      rotation: number;
      vRot: number;
      sprite: HTMLImageElement;
      opacity: number;
      swayPeriod: number;
      swayAmp: number;
    }

    const isMobile = window.innerWidth < 768;
    const baseCount = isMobile ? 5 : 9;
    const maxCount = isMobile ? 8 : 14;

    const petals: Petal[] = [];

    // Sacred Deity Face Protection Zone (excludes petals from upper-center deity face/crown)
    const isInsideFaceZone = (x: number, y: number, w: number, h: number) => {
      const faceLeft = w * 0.32;
      const faceRight = w * 0.68;
      const faceTop = h * 0.05;
      const faceBottom = h * 0.52;
      return x >= faceLeft && x <= faceRight && y >= faceTop && y <= faceBottom;
    };

    const spawnPetal = (startY = -25): Petal | null => {
      if (loadedSprites.length === 0) return null;
      const sprite = loadedSprites[Math.floor(Math.random() * loadedSprites.length)];
      
      // Spawn on outer columns (left 30% or right 30%) to keep Ammavari sacred face & crown clear
      let x: number;
      if (Math.random() < 0.5) {
        x = Math.random() * (canvas.width * 0.32);
      } else {
        x = canvas.width * 0.68 + Math.random() * (canvas.width * 0.32);
      }

      return {
        x,
        baseX: x,
        y: startY,
        size: isMobile ? 14 + Math.random() * 10 : 18 + Math.random() * 14,
        vy: 35 + Math.random() * 35, // Always downward gravity in pixels/sec
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 1.6,
        sprite,
        opacity: 0.75 + Math.random() * 0.25,
        swayPeriod: 1.2 + Math.random() * 1.5,
        swayAmp: 15 + Math.random() * 18,
      };
    };

    let lastTime = performance.now();

    const loop = (now: number) => {
      if (!isTabVisible) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Decay scroll velocity smoothly
      scrollVelocity *= 0.94;

      // Modulate target particle count based on scroll activity
      const currentTarget = Math.round(baseCount + scrollVelocity * (maxCount - baseCount));

      // Spawn if below target count
      if (petals.length < currentTarget && loadedSprites.length > 0) {
        const newPetal = spawnPetal();
        if (newPetal) petals.push(newPetal);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];

        // Always falls downward with real elapsed time (gravity never reverses on scroll)
        p.y += p.vy * dt;
        p.rotation += p.vRot * dt;
        p.x = p.baseX + Math.sin((now / 1000) * (Math.PI * 2 / p.swayPeriod)) * p.swayAmp;

        // Sacred face protection: gently deflect away if drifting too close
        if (isInsideFaceZone(p.x, p.y, canvas.width, canvas.height)) {
          p.baseX += p.x < canvas.width * 0.5 ? -120 * dt : 120 * dt;
          p.x = p.baseX;
        }

        // Remove if off-screen bottom
        if (p.y > canvas.height + 30) {
          if (petals.length > currentTarget) {
            petals.splice(i, 1);
            continue;
          } else {
            // Respawn at top
            const respawned = spawnPetal(-25);
            if (respawned) {
              Object.assign(p, respawned);
            } else {
              petals.splice(i, 1);
              continue;
            }
          }
        }

        // Render petal sprite
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.drawImage(p.sprite, -p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    // Tab visibility handling to pause when hidden
    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) lastTime = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};
