import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Heart,
  Calendar,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Film,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AngelFlixItem } from "../config/angelflixConfig";

interface AngelFlixPlayerModalProps {
  item: AngelFlixItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export function AngelFlixPlayerModal({
  item,
  isOpen,
  onClose,
  onNext,
  onPrev,
}: AngelFlixPlayerModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const isVideo = Boolean(item?.videoUrl);
  const photos =
    item?.photos && item.photos.length > 0
      ? item.photos
      : [{ src: item?.imageUrl || "", caption: item?.subtitle || "" }];

  // Reset state when item changes
  useEffect(() => {
    setCurrentPhotoIndex(0);
    setIsLiked(Boolean(item?.isFavorite));
    setVideoPlaying(true);
    setVideoTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => setVideoPlaying(false));
    }
  }, [item]);

  // Slideshow auto-advance timer (only for photo mode)
  useEffect(() => {
    if (!isOpen || isVideo || !isPlaying || photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isOpen, isVideo, isPlaying, photos.length]);

  // Video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoTime(videoRef.current.currentTime);
      setVideoDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setVideoTime(time);
    }
  };

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setVideoPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") {
        if (isVideo && videoRef.current) {
          videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 5, videoDuration);
        } else if (photos.length > 1) {
          setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
        } else if (onNext) {
          onNext();
        }
      }
      if (e.key === "ArrowLeft") {
        if (isVideo && videoRef.current) {
          videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0);
        } else if (photos.length > 1) {
          setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
        } else if (onPrev) {
          onPrev();
        }
      }
      if (e.key === " ") {
        e.preventDefault();
        if (isVideo) {
          toggleVideoPlay();
        } else {
          setIsPlaying((prev) => !prev);
        }
      }
    },
    [isOpen, isVideo, onClose, onNext, onPrev, photos.length, videoDuration]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !item) return null;

  const currentPhoto = photos[currentPhotoIndex] || photos[0];

  const handleToggleLike = () => {
    setIsLiked(!isLiked);
    if (!isLiked) {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#e50914", "#f43f5e", "#fda4af"],
      });
    }
  };

  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 sm:p-6 overflow-hidden">
        {/* Animated Cinema Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative flex flex-col w-full max-w-5xl max-h-[92vh] bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden text-white"
        >
          {/* Top Control Bar */}
          <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <div className="flex items-center gap-2">
              <span className="bg-rose-600/90 text-white text-[11px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase shadow flex items-center gap-1">
                {isVideo && <Film size={12} />}
                <span>{isVideo ? "ANGELFLIX VIDEO" : "ANGELFLIX CINEMA"}</span>
              </span>
              {item.date && (
                <span className="flex items-center gap-1 text-xs text-zinc-300 font-medium">
                  <Calendar size={13} className="text-rose-400" />
                  {item.date}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                aria-label="Toggle fullscreen"
                className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={onClose}
                aria-label="Close cinema player"
                className="p-2 rounded-full bg-zinc-900/80 hover:bg-rose-600 text-zinc-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Media Screen: Video or Photo Slideshow */}
          <div className="relative w-full flex-1 min-h-[320px] sm:min-h-[480px] bg-black flex items-center justify-center overflow-hidden">
            {isVideo && item.videoUrl ? (
              <div className="relative w-full h-full flex items-center justify-center group">
                <video
                  ref={videoRef}
                  src={item.videoUrl}
                  poster={item.imageUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleTimeUpdate}
                  onEnded={() => setVideoPlaying(false)}
                  onClick={toggleVideoPlay}
                  playsInline
                  autoPlay
                  className="max-h-[65vh] w-full object-contain cursor-pointer"
                />

                {/* Center Play Overlay when paused */}
                {!videoPlaying && (
                  <button
                    onClick={toggleVideoPlay}
                    aria-label="Play video"
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                  >
                    <Play size={28} className="fill-white translate-x-0.5" />
                  </button>
                )}

                {/* Video Scrubber Overlay on Hover */}
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <input
                    type="range"
                    min={0}
                    max={videoDuration || 100}
                    value={videoTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-zinc-700 accent-rose-500 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                    <div className="flex items-center gap-3">
                      <button onClick={toggleVideoPlay} className="hover:text-white">
                        {videoPlaying ? <Pause size={14} /> : <Play size={14} className="fill-white" />}
                      </button>
                      <button onClick={toggleMute} className="hover:text-white">
                        {isMuted ? <VolumeX size={14} className="text-rose-400" /> : <Volume2 size={14} />}
                      </button>
                      <span>
                        {formatTime(videoTime)} / {formatTime(videoDuration)}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          videoRef.current.play();
                          setVideoPlaying(true);
                        }
                      }}
                      title="Replay from start"
                      className="hover:text-white flex items-center gap-1"
                    >
                      <RotateCcw size={12} /> Replay
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentPhoto.src}
                    src={currentPhoto.src}
                    alt={currentPhoto.caption || item.title}
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    className="max-h-[65vh] w-full object-contain select-none"
                  />
                </AnimatePresence>

                {/* Dark Vignette Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30" />

                {/* Previous Photo Button */}
                {photos.length > 1 && (
                  <button
                    onClick={() =>
                      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
                    }
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <ChevronLeft size={22} />
                  </button>
                )}

                {/* Next Photo Button */}
                {photos.length > 1 && (
                  <button
                    onClick={() =>
                      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
                    }
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <ChevronRight size={22} />
                  </button>
                )}

                {/* Photo Slide Indicator */}
                {photos.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                    {photos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPhotoIndex(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentPhotoIndex
                            ? "w-6 bg-rose-500"
                            : "w-1.5 bg-zinc-600 hover:bg-zinc-400"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Cinema Details & Media Controls */}
          <div className="p-4 sm:p-6 bg-zinc-950/95 border-t border-zinc-800/80 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
                    {item.title}
                  </h2>
                  {item.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {item.subtitle && (
                  <p className="text-sm font-semibold text-rose-400">{item.subtitle}</p>
                )}
              </div>

              {/* Playback Controls & Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                {!isVideo && photos.length > 1 && (
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-all border border-zinc-700"
                  >
                    {isPlaying ? (
                      <Pause size={14} className="text-rose-400" />
                    ) : (
                      <Play size={14} className="text-rose-400" />
                    )}
                    <span>{isPlaying ? "Auto Playing" : "Paused"}</span>
                  </button>
                )}

                <button
                  onClick={handleToggleLike}
                  aria-label="Like memory"
                  className={`p-2 rounded-full border transition-all ${
                    isLiked
                      ? "bg-rose-600/20 border-rose-500 text-rose-500"
                      : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Heart size={16} className={isLiked ? "fill-rose-500" : ""} />
                </button>
              </div>
            </div>

            {/* Description / Caption text */}
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans max-w-3xl">
              {currentPhoto.caption || item.description}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
