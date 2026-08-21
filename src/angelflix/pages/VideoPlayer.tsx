import { useState, useEffect, useRef, useCallback } from 'react';
import { Memory, formatTime } from '@/data/memories';
import { getVideoBlobURL } from '@/lib/videoStore';

type PlayerState = 'playing' | 'paused' | 'ended';

interface VideoPlayerProps {
  memories: Memory[];
  memoryId: string;
  watched: Map<string, number>;
  onBack: () => void;
  onUpdateWatched: (id: string, sec: number) => void;
  onPlayNext: (id: string) => void;
}

export default function VideoPlayer({ memories, memoryId, watched, onBack, onUpdateWatched, onPlayNext }: VideoPlayerProps) {
  const memory = memories.find((m) => m.id === memoryId) ?? memories[0];
  const nextMemory = memories[memories.findIndex((m) => m.id === memoryId) + 1] ?? null;

  // Real video element support
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState<string | null>(null);
  const isRealVideo = !!resolvedVideoSrc;

  useEffect(() => {
    let blobUrl: string | null = null;
    setResolvedVideoSrc(null);
    if (!memory.videoSrc) return;

    if (memory.videoSrc.startsWith('idb:')) {
      getVideoBlobURL(memory.id).then((url) => {
        blobUrl = url;
        setResolvedVideoSrc(url);
      });
    } else {
      setResolvedVideoSrc(memory.videoSrc);
    }

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [memory.id, memory.videoSrc]);

  const initialSec = watched.get(memory.id) ?? 0;
  const [currentSec, setCurrentSec] = useState(initialSec >= memory.durationSec * 0.95 ? 0 : initialSec);
  const [effectiveDuration, setEffectiveDuration] = useState(memory.durationSec);
  const [playerState, setPlayerState] = useState<PlayerState>('paused');
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrubTooltip, setScrubTooltip] = useState<{ x: number; time: number } | null>(null);
  const [showVolSlider, setShowVolSlider] = useState(false);
  const [skipFlash, setSkipFlash] = useState<'left' | 'right' | null>(null);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState<number | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerStateRef = useRef(playerState);
  const currentSecRef = useRef(currentSec);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { playerStateRef.current = playerState; }, [playerState]);
  useEffect(() => { currentSecRef.current = currentSec; }, [currentSec]);

  const progress = currentSec / effectiveDuration;

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Wire real video element when src is resolved
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !resolvedVideoSrc) return;
    vid.volume = volume;
    vid.muted = muted;
    vid.playbackRate = speed;
    if (initialSec > 0 && initialSec < (vid.duration || Infinity) * 0.95) {
      vid.currentTime = initialSec;
    }
  }, [resolvedVideoSrc]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  // Simulated playback (non-real-video memories)
  useEffect(() => {
    if (isRealVideo || playerState !== 'playing') return;
    const interval = setInterval(() => {
      setCurrentSec((prev) => {
        const next = prev + 1;
        if (next >= effectiveDuration) {
          setPlayerState('ended');
          onUpdateWatched(memory.id, effectiveDuration);
          return effectiveDuration;
        }
        if (next % 5 === 0) onUpdateWatched(memory.id, next);
        return next;
      });
    }, Math.round(1000 / speed));
    return () => clearInterval(interval);
  }, [isRealVideo, playerState, effectiveDuration, memory.id, speed]);

  // Autoplay countdown
  useEffect(() => {
    if (playerState !== 'ended' || !nextMemory) return;
    setAutoplayCountdown(5);
    const interval = setInterval(() => {
      setAutoplayCountdown((c) => {
        if (c == null || c <= 1) { clearInterval(interval); onPlayNext(nextMemory.id); return null; }
        return c - 1;
      });
    }, 1000);
    return () => { clearInterval(interval); setAutoplayCountdown(null); };
  }, [playerState, nextMemory]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    if (playerStateRef.current === 'playing') {
      controlsTimer.current = setTimeout(() => setShowControls(false), 3200);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isRealVideo && videoRef.current) {
      if (videoRef.current.paused || videoRef.current.ended) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    } else {
      setPlayerState((s) => {
        const next = s === 'playing' ? 'paused' : 'playing';
        playerStateRef.current = next;
        return next;
      });
    }
    resetControlsTimer();
  }, [isRealVideo, resetControlsTimer]);

  const seekBy = useCallback((delta: number) => {
    if (isRealVideo && videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + delta));
    } else {
      setCurrentSec((prev) => {
        const next = Math.max(0, Math.min(effectiveDuration, prev + delta));
        onUpdateWatched(memory.id, next);
        return next;
      });
    }
    setSkipFlash(delta > 0 ? 'right' : 'left');
    setTimeout(() => setSkipFlash(null), 600);
    resetControlsTimer();
  }, [isRealVideo, effectiveDuration, memory.id, onUpdateWatched, resetControlsTimer]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newSec = Math.round(ratio * effectiveDuration);
    if (isRealVideo && videoRef.current) {
      videoRef.current.currentTime = newSec;
    } else {
      setCurrentSec(newSec);
      onUpdateWatched(memory.id, newSec);
    }
  };

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': case 'l': e.preventDefault(); seekBy(10); break;
        case 'ArrowLeft': case 'j': e.preventDefault(); seekBy(-10); break;
        case 'ArrowUp': e.preventDefault(); setVolume((v) => Math.min(1, v + 0.1)); setMuted(false); break;
        case 'ArrowDown': e.preventDefault(); setVolume((v) => Math.max(0, v - 0.1)); break;
        case 'm': setMuted((v) => !v); break;
        case 'f': handleFullscreen(); break;
        case 'Escape': if (!document.fullscreenElement) onBack(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, seekBy, onBack]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) { containerRef.current?.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  const handleScrubMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setScrubTooltip({ x: e.clientX - rect.left, time: Math.round(ratio * effectiveDuration) });
  };

  const volumeIcon = muted || volume === 0 ? 'muted' : volume < 0.4 ? 'low' : 'high';

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: '#000' }} onMouseMove={resetControlsTimer}>

      <div className="relative w-full" style={{ maxWidth: '100vw', aspectRatio: '16/9', maxHeight: '100vh', cursor: playerState === 'playing' && !showControls ? 'none' : 'default' }}
        onClick={togglePlay} onDoubleClick={(e) => { e.stopPropagation(); handleFullscreen(); }}>

        {/* ── Real video or backdrop image ── */}
        {resolvedVideoSrc ? (
          <video
            ref={videoRef}
            src={resolvedVideoSrc}
            className="w-full h-full object-contain"
            style={{ display: 'block', background: '#000' }}
            preload="auto"
            onClick={(e) => e.stopPropagation()}
            onLoadStart={() => setVideoLoading(true)}
            onCanPlay={() => setVideoLoading(false)}
            onLoadedMetadata={() => {
              const dur = Math.round(videoRef.current?.duration ?? memory.durationSec);
              setEffectiveDuration(dur);
            }}
            onTimeUpdate={() => {
              const t = Math.floor(videoRef.current?.currentTime ?? 0);
              setCurrentSec(t);
              if (t % 5 === 0) onUpdateWatched(memory.id, t);
            }}
            onPlay={() => { setPlayerState('playing'); resetControlsTimer(); }}
            onPause={() => setPlayerState('paused')}
            onEnded={() => { setPlayerState('ended'); onUpdateWatched(memory.id, effectiveDuration); }}
          />
        ) : (
          <>
            <img src={memory.backdropUrl} alt={memory.title} className="w-full h-full object-cover" style={{ transition: 'none' }} />
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.32)' }} />
          </>
        )}

        {/* Video loading spinner */}
        {videoLoading && resolvedVideoSrc && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.15)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* Loading indicator while resolving IDB blob */}
        {memory.videoSrc && !resolvedVideoSrc && !videoLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
            <div style={{ width: '30px', height: '30px', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* Skip flash */}
        {skipFlash && (
          <div className="absolute inset-0 flex items-center pointer-events-none" style={{ justifyContent: skipFlash === 'left' ? 'flex-start' : 'flex-end' }}>
            <div className="flex flex-col items-center gap-1 px-10" style={{ animation: 'pageFadeIn 0.15s ease, toastSlideDown 0.4s ease 0.2s forwards' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
                {skipFlash === 'left' ? <><polyline points="1,4 1,10 7,10" /><path d="M3.51 15a9 9 0 1 0 .49-3.27" /></> : <><polyline points="23,4 23,10 17,10" /><path d="M20.49 15a9 9 0 1 1-.49-3.27" /></>}
              </svg>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 600 }}>{skipFlash === 'left' ? '−10s' : '+10s'}</span>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center px-8 pt-6" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, transparent 100%)', height: '120px', opacity: showControls ? 1 : 0, transition: 'opacity 0.25s ease' }}>
          <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'white'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
            Back
          </button>
          <div className="flex-1 text-center">
            <div style={{ color: 'white', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
              {memory.title}
              {isRealVideo && <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', padding: '1px 5px', borderRadius: '3px', background: 'rgba(183,71,90,0.8)', letterSpacing: '0.06em' }}>VIDEO</span>}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '2px' }}>{memory.date}</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); handleFullscreen(); }} style={{ color: 'rgba(255,255,255,0.7)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'white'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen ? <><polyline points="8,3 3,3 3,8" /><polyline points="21,8 21,3 16,3" /><polyline points="3,16 3,21 8,21" /><polyline points="16,21 21,21 21,16" /></> : <><polyline points="15,3 21,3 21,9" /><polyline points="9,21 3,21 3,15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></>}
            </svg>
          </button>
        </div>

        {/* Center pause indicator */}
        {playerState === 'paused' && !videoLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.52)', border: '2px solid rgba(255,255,255,0.28)', backdropFilter: 'blur(6px)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
            </div>
          </div>
        )}

        {/* Keyboard hint */}
        {playerState === 'paused' && (
          <div className="absolute bottom-28 left-1/2 text-xs" style={{ transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.28)', opacity: showControls ? 1 : 0, transition: 'opacity 0.25s ease', whiteSpace: 'nowrap' }}>
            Space · ←/→ skip 10s · M mute · F fullscreen
          </div>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 px-7 pb-5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)', paddingTop: '56px', opacity: showControls ? 1 : 0, transition: 'opacity 0.25s ease' }}
          onClick={(e) => e.stopPropagation()}>

          {/* Scrubber */}
          <div className="relative mb-4 cursor-pointer" style={{ height: '18px', display: 'flex', alignItems: 'center' }}
            onClick={seek} onMouseMove={handleScrubMove} onMouseLeave={() => setScrubTooltip(null)}>
            {scrubTooltip && (
              <div style={{ position: 'absolute', bottom: '20px', left: `${scrubTooltip.x}px`, transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                {formatTime(scrubTooltip.time)}
              </div>
            )}
            <div className="absolute inset-x-0" style={{ height: '3px', background: 'rgba(255,255,255,0.18)', borderRadius: '2px', top: '50%', transform: 'translateY(-50%)' }}>
              <div style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px', position: 'relative' }}>
                <div style={{ position: 'absolute', right: '-5px', top: '50%', transform: 'translateY(-50%)', width: '10px', height: '10px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
              </div>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} style={{ color: 'white', flexShrink: 0 }} className="hover:opacity-75 transition-opacity">
              {playerState === 'playing'
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>}
            </button>
            <button onClick={() => seekBy(-10)} style={{ color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} className="hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,4 1,10 7,10" /><path d="M3.51 15a9 9 0 1 0 .49-3.27" /></svg>
            </button>
            <button onClick={() => seekBy(10)} style={{ color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} className="hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23,4 23,10 17,10" /><path d="M20.49 15a9 9 0 1 1-.49-3.27" /></svg>
            </button>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontVariantNumeric: 'tabular-nums', flexShrink: 0, minWidth: '96px' }}>
              {formatTime(currentSec)} <span style={{ opacity: 0.45 }}>/</span> {formatTime(effectiveDuration)}
            </span>
            <div className="flex-1" />

            {/* Volume */}
            <div className="flex items-center gap-2" style={{ flexShrink: 0 }} onMouseEnter={() => setShowVolSlider(true)} onMouseLeave={() => setShowVolSlider(false)}>
              {showVolSlider && (
                <input type="range" className="vol-slider" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                  onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }} style={{ width: '72px' }} onClick={(e) => e.stopPropagation()} />
              )}
              <button onClick={() => setMuted((v) => !v)} style={{ color: 'rgba(255,255,255,0.7)' }} className="hover:text-white transition-colors">
                {volumeIcon === 'muted'
                  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                  : volumeIcon === 'low'
                    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>}
              </button>
            </div>

            {/* Speed */}
            <div className="relative" style={{ flexShrink: 0 }}>
              <button onClick={(e) => { e.stopPropagation(); setShowSpeedMenu((v) => !v); }} className="text-xs px-2 py-0.5 rounded font-semibold"
                style={{ color: speed !== 1 ? 'var(--accent)' : 'rgba(255,255,255,0.55)', border: `1px solid ${speed !== 1 ? 'var(--accent)' : 'rgba(255,255,255,0.18)'}`, minWidth: '36px' }}>
                {speed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-8 right-0 rounded-xl overflow-hidden shadow-2xl"
                  style={{ background: 'rgba(18,18,20,0.95)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', width: '80px' }}
                  onClick={(e) => e.stopPropagation()}>
                  {SPEEDS.map((s) => (
                    <button key={s} onClick={() => { setSpeed(s); setShowSpeedMenu(false); }} className="w-full px-3 py-1.5 text-xs text-center"
                      style={{ color: s === speed ? 'var(--accent)' : 'rgba(255,255,255,0.7)', fontWeight: s === speed ? 700 : 400, background: s === speed ? 'rgba(183,71,90,0.12)' : 'transparent' }}
                      onMouseEnter={(e) => { if (s !== speed) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
                      onMouseLeave={(e) => { if (s !== speed) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="text-xs px-2 py-0.5 rounded" style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.18)' }}>CC</button>

            <button onClick={handleFullscreen} style={{ color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} className="hover:text-white transition-colors">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isFullscreen ? <><polyline points="8,3 3,3 3,8" /><polyline points="21,8 21,3 16,3" /><polyline points="3,16 3,21 8,21" /><polyline points="16,21 21,21 21,16" /></> : <><polyline points="15,3 21,3 21,9" /><polyline points="9,21 3,21 3,15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></>}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Ended overlay */}
      {playerState === 'ended' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.78)' }}>
          <p className="font-display text-2xl font-semibold text-white mb-8">Another memory worth keeping.</p>
          <div className="flex items-center gap-4 mb-10">
            <button onClick={() => { setCurrentSec(0); setPlayerState('paused'); if (isRealVideo && videoRef.current) { videoRef.current.currentTime = 0; } }}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white" style={{ background: 'var(--accent)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,4 1,10 7,10" /><path d="M3.51 15a9 9 0 1 0 .49-3.27" /></svg>
              Watch Again
            </button>
            <button onClick={onBack} className="px-6 py-3 rounded-full text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}>
              Back to AngelFlix
            </button>
          </div>

          {nextMemory && (
            <div>
              <div className="flex items-center justify-center gap-3 mb-3">
                <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Up Next</p>
                {autoplayCountdown != null && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent)', color: 'white' }}>{autoplayCountdown}s</span>
                )}
              </div>
              <button onClick={() => { setAutoplayCountdown(null); onPlayNext(nextMemory.id); }}
                className="flex items-center gap-0 rounded-xl overflow-hidden group"
                style={{ background: 'var(--bg-card)', border: `1px solid ${autoplayCountdown != null ? 'var(--accent)' : 'var(--border)'}`, width: '300px', transition: 'border-color 0.2s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = autoplayCountdown != null ? 'var(--accent)' : 'var(--border)'; }}>
                <div className="relative flex-shrink-0" style={{ width: '100px', height: '64px' }}>
                  <img src={nextMemory.thumbnail} alt={nextMemory.title} className="w-full h-full object-cover" style={{ transition: 'none' }} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100" style={{ background: 'rgba(0,0,0,0.4)', transition: 'opacity 0.2s' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                  </div>
                </div>
                <div className="text-left px-4 py-3 flex-1">
                  <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{nextMemory.title}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{nextMemory.duration}</div>
                </div>
              </button>
              {autoplayCountdown != null && (
                <button onClick={() => setAutoplayCountdown(null)} className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}>
                  Cancel autoplay
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
