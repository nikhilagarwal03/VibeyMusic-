import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, Heart, ListMusic, Play, Pause, SkipBack, SkipForward, X } from 'lucide-react';
import { usePlayerStore } from '../../../store/usePlayerStore';
import { removeTitlePrefixFromArtist, sanitizeDisplayText } from '../../../lib/api';
import vibeyLogo from '../../../assets/img1.png';

const formatTime = (time) => {
  if (!time || isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const MotionDiv = motion.div;
const DEFAULT_OVERLAY_RGB = '77, 163, 255';
const dominantColorCache = new Map();

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const extractDominantRgbFromImage = (imageUrl) =>
  new Promise((resolve) => {
    if (!imageUrl || typeof window === 'undefined') {
      resolve(DEFAULT_OVERLAY_RGB);
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (!context) {
          resolve(DEFAULT_OVERLAY_RGB);
          return;
        }

        const sampleSize = 36;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        context.drawImage(image, 0, 0, sampleSize, sampleSize);

        const pixelData = context.getImageData(0, 0, sampleSize, sampleSize).data;

        let red = 0;
        let green = 0;
        let blue = 0;
        let weightSum = 0;

        for (let index = 0; index < pixelData.length; index += 16) {
          const r = pixelData[index];
          const g = pixelData[index + 1];
          const b = pixelData[index + 2];
          const alpha = pixelData[index + 3];

          if (alpha < 120) continue;

          const maxChannel = Math.max(r, g, b);
          const minChannel = Math.min(r, g, b);
          const saturationWeight = maxChannel - minChannel;
          const luminance = (r + g + b) / 3;

          if (luminance < 28) continue;

          const weight = saturationWeight + 20;
          red += r * weight;
          green += g * weight;
          blue += b * weight;
          weightSum += weight;
        }

        if (!weightSum) {
          resolve(DEFAULT_OVERLAY_RGB);
          return;
        }

        const avgRed = clamp(Math.round(red / weightSum), 52, 205);
        const avgGreen = clamp(Math.round(green / weightSum), 52, 205);
        const avgBlue = clamp(Math.round(blue / weightSum), 52, 225);

        resolve(`${avgRed}, ${avgGreen}, ${avgBlue}`);
      } catch {
        resolve(DEFAULT_OVERLAY_RGB);
      }
    };

    image.onerror = () => resolve(DEFAULT_OVERLAY_RGB);
    image.src = imageUrl;
  });

const MobilePlayer = () => {
  const shouldReduceMotion = useReducedMotion();
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);
  const isMobilePlayerOpen = usePlayerStore((state) => state.isMobilePlayerOpen);
  const setMobilePlayerOpen = usePlayerStore((state) => state.setMobilePlayerOpen);
  const likedSongs = usePlayerStore((state) => state.likedSongs);
  const toggleLike = usePlayerStore((state) => state.toggleLike);
  const playerBackgroundMode = usePlayerStore((state) => state.playerBackgroundMode);
  const playbackQueue = usePlayerStore((state) => state.playbackQueue);
  const currentQueueIndex = usePlayerStore((state) => state.currentQueueIndex);
  const queueSourceType = usePlayerStore((state) => state.queueSourceType);
  const queueSourceTitle = usePlayerStore((state) => state.queueSourceTitle);
  const playTrackFromQueue = usePlayerStore((state) => state.playTrackFromQueue);
  const playPreviousTrack = usePlayerStore((state) => state.playPreviousTrack);
  const playNextTrack = usePlayerStore((state) => state.playNextTrack);
  const requestSeek = usePlayerStore((state) => state.requestSeek);
  const [isQueueDrawerPinnedOpen, setQueueDrawerPinnedOpen] = useState(true);
  const progressBarRef = useRef(null);

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const isLiked = currentTrack ? likedSongs.some(t => t.id === currentTrack.id) : false;
  const { cleanTrackTitle, cleanTrackArtist } = useMemo(() => {
    const title = sanitizeDisplayText(currentTrack?.title || 'No Track');
    const artist = removeTitlePrefixFromArtist(title, currentTrack?.artist || 'Unknown');
    return { cleanTrackTitle: title, cleanTrackArtist: artist };
  }, [currentTrack]);
  const coverImage = currentTrack?.image || '';
  const [overlayRgb, setOverlayRgb] = useState(DEFAULT_OVERLAY_RGB);

  useEffect(() => {
    let isCancelled = false;

    if (!coverImage) {
      return () => {
        isCancelled = true;
      };
    }

    if (dominantColorCache.has(coverImage)) {
      Promise.resolve().then(() => {
        if (!isCancelled) {
          setOverlayRgb(dominantColorCache.get(coverImage));
        }
      });
      return () => {
        isCancelled = true;
      };
    }

    extractDominantRgbFromImage(coverImage).then((nextRgb) => {
      if (isCancelled) return;
      dominantColorCache.set(coverImage, nextRgb);
      setOverlayRgb(nextRgb);
    });

    return () => {
      isCancelled = true;
    };
  }, [coverImage]);

  const playerBackgroundStyle = useMemo(() => {
    if (!coverImage) {
      return {
        backgroundImage: 'linear-gradient(160deg, #050b1f 0%, #0b1a3c 52%, #15143a 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }

    if (playerBackgroundMode === 'dominant-only') {
      return {
        backgroundColor: `rgb(${overlayRgb})`,
        backgroundImage: `linear-gradient(165deg, rgba(${overlayRgb}, 0.9) 0%, rgba(${overlayRgb}, 0.72) 45%, rgba(7, 21, 47, 0.92) 75%, rgba(4, 10, 26, 1) 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }

    return {
      backgroundImage: `linear-gradient(165deg, rgba(${overlayRgb}, 0.44) 0%, rgba(${overlayRgb}, 0.3) 38%, rgba(7, 21, 47, 0.76) 70%, rgba(4, 10, 26, 0.92) 100%), url(${coverImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  }, [coverImage, overlayRgb, playerBackgroundMode]);

  const screenTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] };

  const hasPlaylistQueue =
    (queueSourceType === 'playlist' || queueSourceType === 'album') && playbackQueue.length > 0;
  const isQueueDrawerOpen = hasPlaylistQueue && isQueueDrawerPinnedOpen;

  const handleProgressClick = (event) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    requestSeek(Math.max(0, Math.min(duration * percent, duration)));
  };

  return (
    <AnimatePresence>
      {isMobilePlayerOpen && (
        <MotionDiv 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={screenTransition}
          className="fixed inset-0 z-[100] overflow-hidden will-change-transform"
          style={playerBackgroundStyle}
        >
          <div className="absolute inset-0 bg-black/18" />

          <div className="relative z-10 h-full w-full p-4 md:p-8">
            <div className="relative h-full w-full panel-card-elevated rounded-2xl p-5 md:p-8 flex flex-col md:flex-row md:items-center md:gap-10 overflow-hidden">
              <div className="w-full md:w-[42%] flex flex-col">
                <div className="flex items-center justify-between mb-5 md:mb-7">
                  <button
                    onClick={() => setMobilePlayerOpen(false)}
                    className="p-2 -ml-2 rounded-lg btn-ghost motion-base"
                    aria-label="Close player"
                  >
                    <ChevronDown className="w-7 h-7 text-gray-200" />
                  </button>
                  <span className="type-caption text-gray-300">Now Playing</span>
                  <div className="flex items-center gap-1">
                    {hasPlaylistQueue && (
                      <button
                        onClick={() => setQueueDrawerPinnedOpen((previous) => !previous)}
                        className="p-2 rounded-lg btn-ghost motion-base"
                        aria-label={isQueueDrawerOpen ? 'Minimize queue drawer' : 'Expand queue drawer'}
                      >
                        <ListMusic className="w-6 h-6 text-gray-300" />
                      </button>
                    )}
                    <button
                      onClick={() => currentTrack && toggleLike(currentTrack)}
                      className="p-2 -mr-2 rounded-lg btn-ghost motion-base"
                      aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-7 h-7 motion-base ${isLiked ? 'text-blue-300 fill-blue-300' : 'text-gray-300 hover:text-blue-300'}`} />
                    </button>
                  </div>
                </div>

                <div className="w-full aspect-square max-h-[42vh] panel-card rounded-2xl overflow-hidden">
                  {currentTrack?.image ? (
                    <img
                      src={currentTrack.image}
                      alt={currentTrack.title || 'cover'}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = vibeyLogo;
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5" />
                  )}
                </div>
              </div>

              <div
                className={`flex-1 flex flex-col justify-end pt-6 md:pt-0 ${
                  hasPlaylistQueue ? (isQueueDrawerOpen ? 'md:pr-[340px]' : 'md:pr-[72px]') : ''
                }`}
              >
                <div className="mb-6 md:mb-8">
                  <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-white line-clamp-2">
                    {cleanTrackTitle}
                  </h2>
                  <p className="text-base md:text-lg text-gray-200 mt-2 line-clamp-1">
                    {cleanTrackArtist}
                  </p>
                </div>

                <div className="mb-8 md:mb-10 w-full md:max-w-3xl">
                  <div
                    ref={progressBarRef}
                    onClick={handleProgressClick}
                    className="w-full h-2 bg-white/10 rounded-full flex items-center overflow-hidden mb-3 cursor-pointer"
                  >
                    <div
                      className="h-full bg-blue-300 rounded-full motion-quick"
                      style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-300 font-medium tabular-nums">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-6 md:gap-8">
                  <button
                    onClick={playPreviousTrack}
                    className="w-12 h-12 rounded-full panel-card motion-base flex items-center justify-center"
                    aria-label="Previous track"
                  >
                    <SkipBack className="w-6 h-6 text-gray-100" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-white rounded-full shadow-md motion-base"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-10 h-10 md:w-11 md:h-11 text-black fill-black" /> : <Play className="w-10 h-10 md:w-11 md:h-11 text-black fill-black ml-1" />}
                  </button>
                  <button
                    onClick={playNextTrack}
                    className="w-12 h-12 rounded-full panel-card motion-base flex items-center justify-center"
                    aria-label="Next track"
                  >
                    <SkipForward className="w-6 h-6 text-gray-100" />
                  </button>
                </div>

              </div>

              {hasPlaylistQueue && (
                <div
                  onClick={() => {
                    if (!isQueueDrawerOpen) {
                      setQueueDrawerPinnedOpen(true);
                    }
                  }}
                  className={`hidden md:flex md:flex-col absolute top-8 bottom-8 right-8 rounded-xl overflow-hidden bg-white/10 border border-white/10 motion-base ${
                    isQueueDrawerOpen ? 'w-[320px]' : 'w-[52px]'
                  } ${isQueueDrawerOpen ? '' : 'cursor-pointer'}`}
                >
                  <button
                    type="button"
                    onClick={() => setQueueDrawerPinnedOpen((previous) => !previous)}
                    className="h-12 w-full flex items-center justify-center btn-ghost motion-base"
                    aria-label={isQueueDrawerOpen ? 'Minimize queue drawer' : 'Expand queue drawer'}
                  >
                    {isQueueDrawerOpen ? (
                      <ChevronRight className="w-5 h-5 text-gray-200" />
                    ) : (
                      <ChevronLeft className="w-5 h-5 text-gray-200" />
                    )}
                  </button>

                  {isQueueDrawerOpen && (
                    <div className="flex h-full min-h-0 flex-col p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="type-title text-white line-clamp-1">Queue</p>
                        <button
                          type="button"
                          onClick={() => setQueueDrawerPinnedOpen(false)}
                          className="p-1.5 rounded-lg btn-ghost motion-base"
                          aria-label="Close queue"
                        >
                          <X className="w-4 h-4 text-gray-200" />
                        </button>
                      </div>
                      <p className="type-caption text-gray-300 mt-1 line-clamp-1">
                        {sanitizeDisplayText(queueSourceTitle || 'Playlist')}
                      </p>

                      <div className="mt-4 flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 pb-3">
                        {playbackQueue.map((track, index) => {
                          const isActive = index === currentQueueIndex;

                          return (
                            <button
                              key={`${track.id}-${index}`}
                              type="button"
                              onClick={() => playTrackFromQueue(index)}
                              className={`w-full text-left rounded-lg p-2.5 motion-base ${
                                isActive
                                  ? 'bg-white/18 border border-white/20'
                                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
                              }`}
                            >
                              <p className="type-body text-white line-clamp-1">{sanitizeDisplayText(track.title)}</p>
                              <p className="type-caption text-gray-300 line-clamp-1 mt-0.5">
                                {sanitizeDisplayText(track.artist || 'Unknown')}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasPlaylistQueue && isQueueDrawerOpen && (
                <div className="md:hidden absolute left-3 right-3 bottom-3 rounded-xl bg-black/45 backdrop-blur-xl border border-white/15 p-3 h-[45vh] flex flex-col min-h-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="type-title text-white line-clamp-1">Queue</p>
                    <button
                      type="button"
                      onClick={() => setQueueDrawerPinnedOpen(false)}
                      className="p-1.5 rounded-lg btn-ghost motion-base"
                      aria-label="Close queue"
                    >
                      <X className="w-4 h-4 text-gray-200" />
                    </button>
                  </div>
                  <p className="type-caption text-gray-300 mt-1 line-clamp-1">
                    {sanitizeDisplayText(queueSourceTitle || 'Playlist')}
                  </p>

                  <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 pb-3">
                    {playbackQueue.map((track, index) => {
                      const isActive = index === currentQueueIndex;

                      return (
                        <button
                          key={`${track.id}-${index}-mobile`}
                          type="button"
                          onClick={() => playTrackFromQueue(index)}
                          className={`w-full text-left rounded-lg p-2.5 motion-base ${
                            isActive
                              ? 'bg-white/18 border border-white/20'
                              : 'bg-white/5 hover:bg-white/10 border border-transparent'
                          }`}
                        >
                          <p className="type-body text-white line-clamp-1">{sanitizeDisplayText(track.title)}</p>
                          <p className="type-caption text-gray-300 line-clamp-1 mt-0.5">
                            {sanitizeDisplayText(track.artist || 'Unknown')}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default MobilePlayer;
