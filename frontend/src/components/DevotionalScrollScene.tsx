import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight, Calendar, ChevronDown, Sparkles } from 'lucide-react';
import type { TranslationDict, Language, PhaseLabels } from '../utils/translations';

interface DevotionalScrollSceneProps {
  bannerImageUrl: string | null;
  lang: Language;
  t: TranslationDict;
  phaseLabels: PhaseLabels;
}

interface DevotionalAssets {
  hasHarathiPlate: boolean;
  harathiPlateSrc: string | null;
  hasFlameVideo: boolean;
  flameVideoSrc: string | null;
  hasPetals: boolean;
  petalSprites: HTMLImageElement[];
}

export const DevotionalScrollScene: React.FC<DevotionalScrollSceneProps> = ({
  bannerImageUrl,
  lang,
  t,
  phaseLabels,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flameCanvasRef = useRef<HTMLCanvasElement>(null);
  const flameVideoRef = useRef<HTMLVideoElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [assets, setAssets] = useState<DevotionalAssets>({
    hasHarathiPlate: false,
    harathiPlateSrc: null,
    hasFlameVideo: false,
    flameVideoSrc: null,
    hasPetals: false,
    petalSprites: [],
  });

  // Track prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    }
  }, []);

  // Probe available assets strictly without assuming or generating cartoon substitutes
  useEffect(() => {
    let isMounted = true;

    // Helper to probe image availability
    const probeImage = (src: string): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            resolve(img);
          } else {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };

    // Helper to probe video availability
    const probeVideo = (src: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => resolve(true);
        video.onerror = () => resolve(false);
        video.src = src;
      });
    };

    const checkDevotionalAssets = async () => {
      // 1. Harathi Plate
      const plateWebp = await probeImage('/assets/devotional/harathi-plate.webp');
      const platePng = plateWebp ? null : await probeImage('/assets/devotional/harathi-plate.png');
      const plateLoaded = Boolean(plateWebp || platePng);
      const plateSrc = plateWebp
        ? '/assets/devotional/harathi-plate.webp'
        : platePng
        ? '/assets/devotional/harathi-plate.png'
        : null;

      // 2. Flame Video
      const flameWebm = await probeVideo('/assets/devotional/flame.webm');
      const flameMp4 = flameWebm ? false : await probeVideo('/assets/devotional/flame.mp4');
      const flameLoaded = flameWebm || flameMp4;
      const flameSrc = flameWebm
        ? '/assets/devotional/flame.webm'
        : flameMp4
        ? '/assets/devotional/flame.mp4'
        : null;

      // 3. Transparent Petals (Rose 1-4 and Marigold 1-4)
      const petalSources = [
        '/assets/devotional/petals/rose-1.webp',
        '/assets/devotional/petals/rose-2.webp',
        '/assets/devotional/petals/rose-3.webp',
        '/assets/devotional/petals/rose-4.webp',
        '/assets/devotional/petals/marigold-1.webp',
        '/assets/devotional/petals/marigold-2.webp',
        '/assets/devotional/petals/marigold-3.webp',
        '/assets/devotional/petals/marigold-4.webp',
      ];
      const loadedPetals: HTMLImageElement[] = [];
      for (const pSrc of petalSources) {
        const img = await probeImage(pSrc);
        if (img) loadedPetals.push(img);
      }

      if (isMounted) {
        setAssets({
          hasHarathiPlate: plateLoaded,
          harathiPlateSrc: plateSrc,
          hasFlameVideo: flameLoaded,
          flameVideoSrc: flameSrc,
          hasPetals: loadedPetals.length > 0,
          petalSprites: loadedPetals,
        });
      }
    };

    checkDevotionalAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  // Track native scroll progress with zero scroll hijacking or wheel interception
  useEffect(() => {
    if (prefersReducedMotion) return;

    let rafId: number | null = null;
    let isIntersecting = true;

    const calculateProgress = () => {
      if (!containerRef.current || !isIntersecting) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollableDistance = rect.height - window.innerHeight;

      if (scrollableDistance <= 0) {
        setScrollProgress(0);
        return;
      }

      const rawProgress = -rect.top / scrollableDistance;
      const clamped = Math.max(0, Math.min(1, rawProgress));
      setScrollProgress(clamped);
    };

    const onScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(calculateProgress);
    };

    // IntersectionObserver to pause scroll listening when scene is off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isIntersecting = entry.isIntersecting;
        if (isIntersecting) {
          calculateProgress();
        }
      },
      { threshold: 0 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Visibility change listener
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (rafId !== null) cancelAnimationFrame(rafId);
      } else if (isIntersecting) {
        calculateProgress();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    calculateProgress();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      observer.disconnect();
    };
  }, [prefersReducedMotion]);

  // Handle accessible Skip action straight to today's programme
  const handleSkip = useCallback(() => {
    const target = document.getElementById('today');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Petal Shower Canvas Simulation (Only runs if genuine photographic petal sprites exist)
  useEffect(() => {
    if (
      prefersReducedMotion ||
      !assets.hasPetals ||
      assets.petalSprites.length === 0 ||
      !canvasRef.current
    ) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    // Resize canvas to match display size
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Petal particle interface
    interface Petal {
      x: number;
      y: number;
      size: number;
      vx: number;
      vy: number;
      rotation: number;
      vRot: number;
      sprite: HTMLImageElement;
      opacity: number;
      baseX: number;
      swayOffset: number;
    }

    const petals: Petal[] = [];
    const PETAL_COUNT = 16; // Restrained density (12–20 active petals)

    // Sacred deity face exclusion zone: center-top 40% width, 12-42% height
    const isInsideFaceZone = (x: number, y: number, w: number, h: number) => {
      const faceLeft = w * 0.35;
      const faceRight = w * 0.65;
      const faceTop = h * 0.12;
      const faceBottom = h * 0.45;
      return x >= faceLeft && x <= faceRight && y >= faceTop && y <= faceBottom;
    };

    const spawnPetal = (startY = -20): Petal => {
      const sprite =
        assets.petalSprites[Math.floor(Math.random() * assets.petalSprites.length)];
      let x = Math.random() * canvas.width;
      // Avoid spawning directly on Ammavari's face
      if (isInsideFaceZone(x, startY, canvas.width, canvas.height)) {
        x = x < canvas.width * 0.5 ? x - 80 : x + 80;
      }

      return {
        x,
        baseX: x,
        y: startY,
        size: 14 + Math.random() * 12,
        vx: 0,
        vy: 40 + Math.random() * 45, // Pixels per second
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 1.5,
        sprite,
        opacity: 0.8 + Math.random() * 0.2,
        swayOffset: Math.random() * Math.PI * 2,
      };
    };

    for (let i = 0; i < PETAL_COUNT; i++) {
      petals.push(spawnPetal(Math.random() * (canvas.height || 600)));
    }

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Only show petals during offering stage (progress 0.20 to 0.85)
      const stageFade =
        scrollProgress < 0.2
          ? 0
          : scrollProgress < 0.35
          ? (scrollProgress - 0.2) / 0.15
          : scrollProgress > 0.8
          ? Math.max(0, (0.9 - scrollProgress) / 0.1)
          : 1;

      if (stageFade > 0) {
        for (const p of petals) {
          // Petals continuously fall forward with clock time, not reversing on scroll
          p.y += p.vy * dt;
          p.rotation += p.vRot * dt;
          p.x = p.baseX + Math.sin(now * 0.0015 + p.swayOffset) * 22;

          // Push away from sacred face zone if drifting too close
          if (isInsideFaceZone(p.x, p.y, canvas.width, canvas.height)) {
            p.x += p.x < canvas.width * 0.5 ? -40 * dt : 40 * dt;
          }

          // Respawn at top once past bottom
          if (p.y > canvas.height + 30) {
            Object.assign(p, spawnPetal(-20));
          }

          ctx.save();
          ctx.globalAlpha = p.opacity * stageFade;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.drawImage(
            p.sprite,
            -p.size / 2,
            -p.size / 2,
            p.size,
            p.size
          );
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [assets.hasPetals, assets.petalSprites, scrollProgress, prefersReducedMotion]);

  // Real-time Flame Transparency Processing (Ensures 0% black rectangle artifacts across all backgrounds)
  useEffect(() => {
    if (prefersReducedMotion || !assets.hasFlameVideo) return;

    let animId: number;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 240;
    tempCanvas.height = 360;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    const renderFlame = () => {
      const canvas = flameCanvasRef.current;
      const video = flameVideoRef.current;

      if (canvas && video && tempCtx && video.readyState >= 2) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          tempCtx.drawImage(video, 0, 0, 240, 360);
          const imgData = tempCtx.getImageData(0, 0, 240, 360);
          const d = imgData.data;

          for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            // Black pixels (0,0,0) become completely transparent
            const luma = Math.max(r, g, b);
            d[i + 3] = luma;
          }

          ctx.clearRect(0, 0, 240, 360);
          ctx.putImageData(imgData, 0, 0);
        }
      }

      animId = requestAnimationFrame(renderFlame);
    };

    const videoEl = flameVideoRef.current;
    if (videoEl) {
      videoEl.play().catch(() => {});
    }

    animId = requestAnimationFrame(renderFlame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [assets.hasFlameVideo, prefersReducedMotion]);

  // Reduced motion static fallback: clean devotional hero without scroll pinning
  if (prefersReducedMotion) {
    return (
      <section className="relative py-12 md:py-16 overflow-hidden bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>{t.hero.tagline}</span>
              </div>
              <h1 className="text-main-title text-slate-900 tracking-normal">
                {t.hero.titleMain}
              </h1>
              <div className="space-y-1">
                <p className="text-[18px] sm:text-[20px] font-medium text-amber-900 leading-[1.6]">
                  {t.hero.subtitleOrg}
                </p>
                <p className="text-[15px] sm:text-[16px] font-medium text-slate-700 flex items-center justify-center lg:justify-start gap-2 leading-[1.6]">
                  <Calendar className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>{t.hero.dates}</span>
                </p>
              </div>
              <p className="text-[16px] sm:text-[17px] text-slate-600 font-normal leading-[1.75] max-w-2xl">
                {t.hero.welcomeMsg}
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <a
                  href={phaseLabels.heroBtnHref}
                  className="w-full sm:w-auto px-7 py-3 bg-amber-700 hover:bg-amber-800 text-white font-medium text-[15px] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {phaseLabels.heroBtn} <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#donations"
                  className="w-full sm:w-auto px-7 py-3 bg-white hover:bg-amber-50/60 border border-amber-300 text-amber-900 font-medium text-[15px] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {t.hero.btnDonations}
                </a>
              </div>
            </div>

            {/* Right Deity Image */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative max-w-[340px] sm:max-w-md w-full">
                <div className="rounded-3xl bg-white p-3.5 border border-amber-200/80 shadow-md overflow-hidden">
                  <div className="rounded-2xl overflow-hidden bg-amber-950/5 flex items-center justify-center">
                    <img
                      src={bannerImageUrl || '/ammavaru-hero-green.webp'}
                      alt={
                        lang === 'te'
                          ? 'గరువుపాలెం గ్రామ దేవత శ్రీ కనకదుర్గా అమ్మవారు (నిజరూపం)'
                          : 'Garuvupalem Village Deity Sri Kanaka Durga Ammavaru (Sacred Form)'
                      }
                      className="w-full max-h-[460px] sm:max-h-[500px] object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/ammavaru-hero-green.jpg') {
                          target.src = '/ammavaru-hero-green.jpg';
                        }
                      }}
                    />
                  </div>
                  <div className="mt-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-center space-y-0.5">
                    <p className="text-sm font-medium text-amber-950">
                      {lang === 'te'
                        ? 'గరువుపాలెం గ్రామ దేవత శ్రీ కనకదుర్గా అమ్మవారు (నిజరూపం)'
                        : 'Sri Kanaka Durga Ammavaru — Garuvupalem Village Deity'}
                    </p>
                    <p className="text-sm font-normal text-stone-600 italic">
                      {t.hero.photoCaptionMantra}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Time-based harathi movement (never rewinds when scrolling backwards)
  const currentTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const harathiArcX = Math.sin(currentTime * 0.0016) * 32;
  const harathiArcY = Math.cos(currentTime * 0.0022) * 10;

  // Scroll phase calculations
  // Phase 1 (0.00 – 0.25): Pure Darshan & Sacred Mantra
  // Phase 2 (0.25 – 0.75): Harathi Offering & Petal Shower
  // Phase 3 (0.75 – 1.00): Transitioning smoothly into the Festival Information
  const darshanNoticeOpacity = Math.max(0, 1 - scrollProgress * 3.5);
  const exitOpacity = scrollProgress > 0.85 ? Math.max(0, 1 - (scrollProgress - 0.85) * 6) : 1;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[160svh] sm:h-[220svh]"
      style={{ zIndex: 10 }}
    >
      {/* Sticky Visual Stage - Pinned cleanly below the 80px header */}
      <div
        className="sticky top-20 h-[calc(100svh-5rem)] w-full overflow-hidden bg-gradient-to-b from-amber-50/60 via-white to-amber-50/30 flex flex-col justify-between"
      >
        <div
          className="w-full h-full flex flex-col justify-between transition-opacity duration-200"
          style={{ opacity: exitOpacity }}
        >
          {/* Top Floating Control Bar */}
          <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 pt-2.5 sm:pt-4 flex items-center justify-between z-30 pointer-events-auto">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs sm:text-sm font-medium shadow-2xs backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="truncate max-w-[190px] sm:max-w-none">{t.hero.tagline}</span>
            </div>

            {/* Prominent Accessible Skip Link */}
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-amber-50 text-amber-900 border border-amber-300 shadow-xs text-xs sm:text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 backdrop-blur-xs cursor-pointer group"
              aria-label={t.hero.skipToProgrammes || (lang === 'te' ? 'కార్యక్రమాలకు వెళ్లండి' : 'Skip to Programmes')}
            >
              <span>{t.hero.skipToProgrammes || (lang === 'te' ? 'కార్యక్రమాలకు వెళ్లండి' : 'Skip to Programmes')}</span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-700 transition-transform group-hover:translate-y-0.5" />
            </button>
          </div>

          {/* Petal Shower Canvas (Only if genuine petal photographic sprites are available) */}
          {assets.hasPetals && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
            />
          )}

          {/* Center Stage: Authentic Sri Kanaka Durga Ammavaru Darshan */}
          <div className="relative flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-10 z-10 py-1 sm:py-3">
            
            {/* Left Content on Desktop / Top+Bottom on Mobile */}
            <div className="w-full lg:w-7/12 flex flex-col items-center lg:items-start text-center lg:text-left space-y-2.5 sm:space-y-4 order-2 lg:order-1">
              
              <h1 className="text-xl sm:text-2xl lg:text-main-title text-slate-900 tracking-normal transition-all duration-300">
                {t.hero.titleMain}
              </h1>

              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-[15px] sm:text-[18px] lg:text-[20px] font-medium text-amber-900 leading-[1.4]">
                  {t.hero.subtitleOrg}
                </p>
                <p className="text-[13px] sm:text-[15px] font-medium text-slate-700 flex items-center justify-center lg:justify-start gap-1.5 leading-[1.4]">
                  <Calendar className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  <span>{t.hero.dates}</span>
                </p>
              </div>

              {/* Devotional Welcome Text (Hidden on small mobile to give Ammavari maximum space) */}
              <p className="text-[14px] sm:text-[16px] text-slate-600 font-normal leading-[1.65] max-w-xl hidden md:block">
                {t.hero.welcomeMsg}
              </p>

              {/* CTAs */}
              <div className="pt-0.5 sm:pt-1 flex flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-3 w-full sm:w-auto">
                <a
                  href={phaseLabels.heroBtnHref}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs sm:text-[15px] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {phaseLabels.heroBtn} <ArrowRight className="h-3.5 w-3.5" />
                </a>
                <a
                  href="#donations"
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white hover:bg-amber-50/70 border border-amber-300 text-amber-900 font-medium text-xs sm:text-[15px] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {t.hero.btnDonations}
                </a>
              </div>

              {/* Quick Stat Badges */}
              <div className="pt-1 grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-sm sm:max-w-md">
                <div className="p-1.5 sm:p-2 bg-white/90 border border-amber-200/70 rounded-xl text-center shadow-2xs">
                  <p className="text-[15px] sm:text-[18px] lg:text-[20px] font-medium text-amber-800">{t.hero.statDays}</p>
                  <p className="text-[10px] sm:text-xs font-normal text-slate-600">{t.hero.statDaysLabel}</p>
                </div>
                <div className="p-1.5 sm:p-2 bg-white/90 border border-amber-200/70 rounded-xl text-center shadow-2xs">
                  <p className="text-[15px] sm:text-[18px] lg:text-[20px] font-medium text-amber-800">{t.hero.statAlankarams}</p>
                  <p className="text-[10px] sm:text-xs font-normal text-slate-600">{t.hero.statAlankaramsLabel}</p>
                </div>
                <div className="p-1.5 sm:p-2 bg-white/90 border border-amber-200/70 rounded-xl text-center shadow-2xs">
                  <p className="text-[12px] sm:text-[16px] lg:text-[18px] font-medium text-amber-800 leading-tight">{t.hero.statGramotsavam}</p>
                  <p className="text-[10px] sm:text-xs font-normal text-slate-600">{t.hero.statGramotsavamLabel}</p>
                </div>
              </div>

            </div>

            {/* Right: Deity Sacred Darshan Frame */}
            <div className="relative w-full lg:w-5/12 flex flex-col items-center justify-center order-1 lg:order-2 shrink-0">
              
              {/* Ambient Devotional Halo Behind Deity */}
              <div
                className="absolute -inset-3 sm:-inset-6 bg-gradient-radial from-amber-400/25 via-amber-200/10 to-transparent rounded-full blur-2xl pointer-events-none transition-opacity duration-700"
                style={{
                  opacity: 0.8 + Math.sin(currentTime * 0.002) * 0.15,
                }}
              />

              {/* Sacred Deity Card */}
              <div className="relative max-w-[240px] sm:max-w-[320px] lg:max-w-[360px] w-full rounded-2xl sm:rounded-3xl bg-white p-2 sm:p-3 border border-amber-200/80 shadow-md">
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-amber-950/5 flex items-center justify-center">
                  <img
                    src={bannerImageUrl || '/ammavaru-hero-green.webp'}
                    alt={
                      lang === 'te'
                        ? 'గరువుపాలెం గ్రామ దేవత శ్రీ కనకదుర్గా అమ్మవారు (నిజరూపం)'
                        : 'Garuvupalem Village Deity Sri Kanaka Durga Ammavaru (Sacred Form)'
                    }
                    className="w-full h-auto max-h-[220px] sm:max-h-[340px] lg:max-h-[420px] object-contain transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/ammavaru-hero-green.jpg') {
                        target.src = '/ammavaru-hero-green.jpg';
                      }
                    }}
                  />

                  {/* Unified Moving Harathi Group (Plate & Flame locked in single transform group) */}
                  {assets.hasHarathiPlate && (
                    <div
                      className="absolute inset-x-0 bottom-1 sm:bottom-2 flex items-center justify-center pointer-events-none transition-all duration-300"
                      style={{
                        transform: `translate(${harathiArcX}px, ${harathiArcY}px) translateY(${
                          scrollProgress < 0.2
                            ? 60
                            : scrollProgress < 0.35
                            ? (1 - (scrollProgress - 0.2) / 0.15) * 60
                            : 0
                        }px)`,
                        opacity:
                          scrollProgress < 0.18
                            ? 0
                            : scrollProgress < 0.35
                            ? (scrollProgress - 0.18) / 0.17
                            : scrollProgress > 0.8
                            ? Math.max(0, (0.95 - scrollProgress) / 0.15)
                            : 1,
                      }}
                    >
                      {/* Harathi Plate + Central Holder Flame Assembly */}
                      <div className="relative w-[210px] sm:w-[270px] lg:w-[310px] aspect-[1024/768]">
                        {/* 1. Authentic Brass Harathi Plate */}
                        <img
                          src={assets.harathiPlateSrc || '/assets/devotional/harathi-plate.webp'}
                          alt="Authentic Brass Harathi Plate"
                          className="w-full h-full object-contain filter drop-shadow-xl"
                        />

                        {/* 2. Flame Canvas anchored precisely to the plate's central holder */}
                        {/* Plate central cup is at X: 50.0%, Y: 49.5%. Flame base is at bottom center (50%, 79.2%) */}
                        {assets.hasFlameVideo && (
                          <div
                            className="absolute pointer-events-none"
                            style={{
                              left: '50%',
                              top: '49.5%',
                              width: '28%',
                              height: '60%',
                              transform: 'translate(-50%, -79.2%)',
                              zIndex: 20,
                            }}
                          >
                            <canvas
                              ref={flameCanvasRef}
                              width={240}
                              height={360}
                              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,180,50,0.4)]"
                            />
                            {/* Hidden video element used as frame source for transparency keying */}
                            <video
                              ref={flameVideoRef}
                              src={assets.flameVideoSrc || '/assets/devotional/flame.webm'}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="absolute opacity-[0.001] pointer-events-none w-1 h-1"
                            />
                          </div>
                        )}

                        {/* 3. Subtle Warm Ambient Camphor Glow in Central Cup */}
                        <div
                          className="absolute pointer-events-none rounded-full blur-md"
                          style={{
                            left: '50%',
                            top: '48%',
                            width: '28%',
                            height: '24%',
                            transform: 'translate(-50%, -50%)',
                            background:
                              'radial-gradient(circle, rgba(255, 170, 30, 0.45) 0%, rgba(255, 120, 0, 0.15) 60%, transparent 100%)',
                            zIndex: 15,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Deity Caption & Mantra */}
                <div className="mt-2 p-1.5 sm:p-2 rounded-xl bg-amber-50/70 border border-amber-200/60 text-center space-y-0.5">
                  <p className="text-[11px] sm:text-xs lg:text-sm font-medium text-amber-950 leading-snug">
                    {lang === 'te'
                      ? 'గరువుపాలెం గ్రామ దేవత శ్రీ కనకదుర్గా అమ్మవారు'
                      : 'Sri Kanaka Durga Ammavaru — Garuvupalem'}
                  </p>
                  <p className="text-[10px] sm:text-[11px] lg:text-xs font-normal text-stone-600 italic leading-snug">
                    {t.hero.photoCaptionMantra}
                  </p>
                </div>

              </div>

            </div>

          </div>

          {/* Bottom Devotional Scroll Indicator */}
          <div
            className="w-full py-1.5 sm:py-2.5 flex flex-col items-center justify-center text-center z-20 pointer-events-none transition-opacity duration-300"
            style={{ opacity: darshanNoticeOpacity }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-amber-200/70 text-amber-800 text-xs sm:text-sm font-medium shadow-2xs backdrop-blur-2xs">
              <span>{t.hero.scrollForDarshan || (lang === 'te' ? 'దివ్య దర్శనం కోసం స్క్రోల్ చేయండి' : 'Scroll for Divine Darshan')}</span>
              <ChevronDown className="h-3.5 w-3.5 text-amber-600 animate-bounce" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
