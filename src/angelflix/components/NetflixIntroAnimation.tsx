import React, { useEffect, useRef, useState } from 'react';
import { netflixSound } from '../../lib/netflixSound';

interface NetflixIntroAnimationProps {
  onComplete: () => void;
  autoPlaySound?: boolean;
}

interface SpectralRay {
  x: number;
  width: number;
  color: string;
  glowColor: string;
  speed: number;
  alpha: number;
  blur: number;
  length: number;
  yOffset: number;
}

interface ParticleMote {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  alpha: number;
}

// Authentic Netflix Spectrum Colors (2019-present brand identity)
const SPECTRUM_PALETTE = [
  { color: '#E50914', glow: 'rgba(229, 9, 20, 0.95)' },   // Netflix Red
  { color: '#FF2A42', glow: 'rgba(255, 42, 66, 0.95)' },  // Bright Crimson
  { color: '#B7475A', glow: 'rgba(183, 71, 90, 0.85)' },  // Rose Gold
  { color: '#FF007F', glow: 'rgba(255, 0, 127, 0.85)' },  // Neon Magenta
  { color: '#9B51E0', glow: 'rgba(155, 81, 224, 0.85)' }, // Royal Violet
  { color: '#00D2FF', glow: 'rgba(0, 210, 255, 0.9)' },   // Electric Cyan
  { color: '#3A86FF', glow: 'rgba(58, 134, 255, 0.85)' }, // Deep Azure
  { color: '#FFAA00', glow: 'rgba(255, 170, 0, 0.9)' },   // Warm Amber
  { color: '#FF6B8B', glow: 'rgba(255, 107, 139, 0.85)' },// Soft Coral
  { color: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.98)' },// Core White
];

export const NetflixIntroAnimation: React.FC<NetflixIntroAnimationProps> = ({
  onComplete,
  autoPlaySound = true,
}) => {
  const [phase, setPhase] = useState<'initial' | 'strike1' | 'strike2' | 'tunnel' | 'fade' | 'done'>('initial');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasTriggeredRef = useRef(false);

  const startAudio = () => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    netflixSound.playTudum();
  };

  // 1. Audio & Phase Transitions
  useEffect(() => {
    if (autoPlaySound) {
      startAudio();
    }

    // Phase 1: Strike 1 ("Ta") at 0.15s
    const t1 = setTimeout(() => setPhase('strike1'), 150);

    // Phase 2: Strike 2 ("DUM" Bass Impact) at 0.55s
    const t2 = setTimeout(() => setPhase('strike2'), 550);

    // Phase 3: Tunnel Hyper-Zoom at 2.10s
    const t3 = setTimeout(() => setPhase('tunnel'), 2100);

    // Phase 4: Smooth Velvet Crossfade at 3.85s
    const t4 = setTimeout(() => setIsFadingOut(true), 3850);

    // Phase 5: Complete & Unmount at 4.65s (Seamless reveal of AngelFlix)
    const t5 = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 4650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [autoPlaySound, onComplete]);

  // 2. High-Definition GPU-Accelerated Canvas Spectral Ribbon & Particle Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate high-density realistic light rays
    const rayCount = 90;
    const rays: SpectralRay[] = [];
    for (let i = 0; i < rayCount; i++) {
      const palette = SPECTRUM_PALETTE[i % SPECTRUM_PALETTE.length];
      const isCenter = Math.abs(i - rayCount / 2) < 12;
      rays.push({
        x: (i / rayCount) * width + (Math.random() * 12 - 6),
        width: isCenter ? Math.random() * 6 + 4 : Math.random() * 3.5 + 1.5,
        color: palette.color,
        glowColor: palette.glow,
        speed: Math.random() * 14 + 20,
        alpha: 0,
        blur: isCenter ? 2 : Math.random() * 4 + 1,
        length: height * (Math.random() * 0.7 + 0.8),
        yOffset: Math.random() * height,
      });
    }

    // Floating optical dust particles
    const particleCount = 60;
    const particles: ParticleMote[] = [];
    for (let i = 0; i < particleCount; i++) {
      const palette = SPECTRUM_PALETTE[Math.floor(Math.random() * SPECTRUM_PALETTE.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.6,
        color: palette.color,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 2.5 - 0.5,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      // Render during and after Strike 2 (0.55s)
      if (elapsed >= 0.55) {
        const strikeElapsed = elapsed - 0.55;
        const globalScale = strikeElapsed < 1.55 ? 1 + strikeElapsed * 0.22 : 1.34 + Math.pow(strikeElapsed - 1.55, 2.3) * 1.9;
        const globalAlpha = strikeElapsed < 0.2 ? strikeElapsed / 0.2 : Math.max(0, 1 - Math.max(0, strikeElapsed - 3.1) * 1.4);

        // Center warm red bloom
        const centerX = width / 2;
        const centerY = height / 2;
        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.7 * globalScale);
        grad.addColorStop(0, `rgba(229, 9, 20, ${0.55 * globalAlpha})`);
        grad.addColorStop(0.3, `rgba(183, 71, 90, ${0.25 * globalAlpha})`);
        grad.addColorStop(0.7, `rgba(155, 81, 224, ${0.08 * globalAlpha})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Render light rays with screen blend mode
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        rays.forEach((ray, idx) => {
          const wave = Math.sin(strikeElapsed * 3 + idx * 0.4);
          ray.alpha = Math.min(1, strikeElapsed * 3.5) * (0.65 + 0.35 * wave) * globalAlpha;

          // Smooth parallax expansion outward from center
          const distFromCenter = ray.x - centerX;
          const currentX = centerX + distFromCenter * globalScale;

          if (currentX < -60 || currentX > width + 60) return;

          ctx.shadowColor = ray.glowColor;
          ctx.shadowBlur = ray.blur * 6;

          const rayGrad = ctx.createLinearGradient(0, 0, 0, height);
          rayGrad.addColorStop(0, 'rgba(0,0,0,0)');
          rayGrad.addColorStop(0.2, ray.glowColor.replace(')', `, ${ray.alpha * 0.5})`));
          rayGrad.addColorStop(0.5, `rgba(255, 255, 255, ${ray.alpha * 0.95})`);
          rayGrad.addColorStop(0.8, ray.glowColor.replace(')', `, ${ray.alpha * 0.5})`));
          rayGrad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.fillStyle = rayGrad;
          ctx.fillRect(currentX - (ray.width * globalScale) / 2, 0, ray.width * globalScale, height);
        });

        // Render floating optical motes
        particles.forEach((p) => {
          p.x += p.vx * globalScale;
          p.y += p.vy * globalScale;
          if (p.y < 0) p.y = height;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * globalScale, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.globalAlpha = p.alpha * globalAlpha;
          ctx.fill();
        });

        ctx.restore();
      }

      if (elapsed < 4.8) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const handleScreenClick = (e: React.MouseEvent) => {
    if (!hasTriggeredRef.current) {
      startAudio();
      return;
    }
    e.stopPropagation();
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 280);
  };

  if (phase === 'done') return null;

  return (
    <div
      onClick={handleScreenClick}
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black select-none cursor-pointer overflow-hidden transition-all duration-1000 ease-out ${
        isFadingOut ? 'opacity-0 scale-[1.04] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: '#000000',
        perspective: '1400px',
      }}
    >
      {/* 1. HD Cinematic Vignette & Atmospheric Radial Backdrop */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          phase === 'strike2' || phase === 'tunnel'
            ? 'opacity-100'
            : phase === 'strike1'
            ? 'opacity-75'
            : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle at 50% 48%, rgba(229, 9, 20, 0.52) 0%, rgba(145, 0, 18, 0.28) 36%, rgba(10, 0, 2, 0.96) 70%, #000000 100%)',
        }}
      />

      {/* 2. Anamorphic Horizontal Lens Flare Streak (Strike 2) */}
      <div
        className={`absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none transition-all duration-700 ${
          phase === 'strike2'
            ? 'opacity-90 scale-y-100'
            : phase === 'tunnel'
            ? 'opacity-20 scale-y-150 blur-md'
            : 'opacity-0 scale-y-0'
        }`}
        style={{
          height: '1.5px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(229,9,20,0.15) 20%, #E50914 42%, #FFFFFF 50%, #E50914 58%, rgba(229,9,20,0.15) 80%, transparent 100%)',
          boxShadow: '0 0 22px 4px rgba(229, 9, 20, 0.9), 0 0 6px 1.5px #FFFFFF',
        }}
      />

      {/* 3. GPU Canvas Particle & Spectral Ray Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full"
      />

      {/* 4. Photorealistic 3D Netflix Ribbon Monogram 'A' */}
      <div
        className={`relative flex flex-col items-center justify-center transition-all ${
          phase === 'strike1'
            ? 'scale-95 opacity-90'
            : phase === 'strike2'
            ? 'scale-100 opacity-100 animate-netflix-hd-bloom'
            : phase === 'tunnel'
            ? 'scale-[2.8] opacity-0 blur-2xl duration-1000'
            : 'scale-70 opacity-0'
        }`}
        style={{
          transitionDuration: phase === 'tunnel' ? '1800ms' : '280ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Monogram Structure: 3D Photorealistic Netflix Ribbon 'A' */}
        <div className="relative w-56 h-72 sm:w-68 sm:h-84 flex items-center justify-center filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.98)]">
          <svg
            viewBox="0 0 260 300"
            className="w-full h-full overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Back Left Leg: Dark 3D Shaded Ribbon */}
              <linearGradient id="netflixLegLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A80710" />
                <stop offset="35%" stopColor="#750007" />
                <stop offset="75%" stopColor="#4A0004" />
                <stop offset="100%" stopColor="#250002" />
              </linearGradient>

              {/* Back Right Leg: Primary Illuminated Ribbon */}
              <linearGradient id="netflixLegRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF3848" />
                <stop offset="28%" stopColor="#E50914" />
                <stop offset="70%" stopColor="#B8000C" />
                <stop offset="100%" stopColor="#660006" />
              </linearGradient>

              {/* Front Hero Ribbon (Folded diagonal & crossbar): 3D Fold with Specular Lighting */}
              <linearGradient id="netflixHeroFold" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="12%" stopColor="#FF4A57" />
                <stop offset="42%" stopColor="#E50914" />
                <stop offset="80%" stopColor="#A8000C" />
                <stop offset="100%" stopColor="#5E0007" />
              </linearGradient>

              {/* Horizontal Crossbar Ribbon */}
              <linearGradient id="netflixCrossbar" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="16%" stopColor="#FF4A57" />
                <stop offset="48%" stopColor="#E50914" />
                <stop offset="85%" stopColor="#8A000A" />
                <stop offset="100%" stopColor="#4A0005" />
              </linearGradient>

              {/* High-definition 3D Shadow Filter */}
              <filter id="netflixShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="-2" dy="10" stdDeviation="6" floodColor="#000000" floodOpacity="0.98" />
              </filter>

              {/* Glow Bloom Filter */}
              <filter id="netflixBloom" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Ambient Red Backlight Glow */}
            <circle cx="130" cy="150" r="105" fill="#E50914" opacity="0.35" filter="url(#netflixBloom)" />

            {/* 1. Back Left Ribbon Leg (Cast in deep 3D shadow with Netflix curved base arch) */}
            <path
              d="M 130,18 L 88,18 L 24,270 Q 48,265 72,262 L 114,84 L 130,18 Z"
              fill="url(#netflixLegLeft)"
            />

            {/* 2. Back Right Ribbon Leg (Illuminated with Netflix curved base arch) */}
            <path
              d="M 130,18 L 172,18 L 236,270 Q 212,265 188,262 L 146,84 L 130,18 Z"
              fill="url(#netflixLegRight)"
              filter="url(#netflixBloom)"
            />

            {/* 3. Front Diagonal Folding Ribbon (Slanted across the front with 3D drop shadow) */}
            <path
              d="M 130,18 L 88,18 L 194,196 L 236,270 Q 212,265 188,262 L 146,196 L 130,18 Z"
              fill="url(#netflixHeroFold)"
              filter="url(#netflixShadow)"
            />

            {/* 4. Front Horizontal Crossbar Ribbon (Overlapping with 3D shadow) */}
            <path
              d="M 56,154 L 204,154 L 192,194 L 68,194 Z"
              fill="url(#netflixCrossbar)"
              filter="url(#netflixShadow)"
            />

            {/* 5. Apex Top Ribbon Cap Highlight */}
            <path
              d="M 88,18 L 130,18 L 172,18 L 152,56 L 108,56 Z"
              fill="url(#netflixHeroFold)"
              opacity="0.9"
            />

            {/* 6. Sharp Specular Rim Highlights (Authentic Netflix metallic sheen) */}
            {/* Outer Left Edge Rim */}
            <path
              d="M 130,18 L 24,270"
              stroke="#FFA4AC"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.65"
            />
            {/* Outer Right Edge Specular Sheen */}
            <path
              d="M 130,18 L 236,270"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.95"
            />
            {/* Crossbar Top Specular Edge */}
            <path
              d="M 56,154 L 204,154"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              opacity="0.95"
            />
          </svg>

          {/* Central Incandescent Flare Burst */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none transition-all duration-700 ${
              phase === 'strike2' ? 'scale-150 opacity-95' : 'scale-50 opacity-15'
            }`}
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(255,50,70,0.7) 25%, rgba(229,9,20,0.35) 50%, transparent 70%)',
              filter: 'blur(12px)',
            }}
          />
        </div>

        {/* Wordmark: ANGELFLIX in Iconic Netflix Bold Condensed Typography */}
        <div className="mt-8 text-center select-none">
          <div
            className="text-4xl sm:text-6xl font-black uppercase tracking-[0.18em] bg-clip-text text-transparent"
            style={{
              fontFamily: "'Bebas Neue', 'Anton', 'Impact', 'Montserrat', sans-serif",
              backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #FF3344 14%, #E50914 48%, #960008 100%)',
              filter: 'drop-shadow(0 0 30px rgba(229, 9, 20, 0.95)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.95))',
              letterSpacing: '0.18em',
              lineHeight: 1.05,
            }}
          >
            ANGELFLIX
          </div>
          <div
            className="text-xs sm:text-sm font-extrabold tracking-[0.45em] uppercase mt-2.5"
            style={{
              fontFamily: "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              letterSpacing: '0.45em',
              color: 'rgba(240, 240, 240, 0.85)',
              textShadow: '0 2px 10px rgba(0,0,0,0.95)',
            }}
          >
            OUR PRIVATE CINEMA
          </div>
        </div>
      </div>

      {/* 5. Cinematic Film Grain Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 6. Sleek Minimal Skip Button */}
      <button
        onClick={handleScreenClick}
        className="absolute bottom-6 right-6 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-white/50 hover:text-white border border-white/20 hover:border-white/60 bg-black/60 backdrop-blur-md transition-all shadow-xl hover:scale-105 active:scale-95"
      >
        SKIP INTRO
      </button>

      {/* Inline HD Keyframe Animations */}
      <style>{`
        @keyframes netflixHdBloom {
          0% { transform: scale(0.94); filter: brightness(2.1) contrast(1.3); }
          30% { transform: scale(1.06); filter: brightness(1.35) contrast(1.15); }
          100% { transform: scale(1.02); filter: brightness(1.0) contrast(1.0); }
        }
        .animate-netflix-hd-bloom {
          animation: netflixHdBloom 1.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default NetflixIntroAnimation;
