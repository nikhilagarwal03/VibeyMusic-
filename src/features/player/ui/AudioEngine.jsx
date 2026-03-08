import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../../store/usePlayerStore';
import { getBestAudioStreamUrl } from '../../../lib/api';

const AudioEngine = () => {
  const audioRef = useRef(new Audio());
  const loadTokenRef = useRef(0);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const seekTime = usePlayerStore((state) => state.seekTime);
  const setProgress = usePlayerStore((state) => state.setProgress);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const clearSeek = usePlayerStore((state) => state.clearSeek);
  const audioQuality = usePlayerStore((state) => state.audioQuality);
  const playNextTrack = usePlayerStore((state) => state.playNextTrack);
  const playPreviousTrack = usePlayerStore((state) => state.playPreviousTrack);

  useEffect(() => {
    const currentLoadToken = ++loadTokenRef.current;

    const playSong = async () => {
      if (!currentTrack) {
        const audio = audioRef.current;
        audio.pause();
        audio.src = '';
        setIsPlaying(false);
        setProgress(0);
        setDuration(0);
        return;
      }
      
      const audio = audioRef.current;
      audio.pause(); 
      audio.removeAttribute('src');
      audio.load();
      setIsPlaying(false); 
      setProgress(0);
      setDuration(0);
      
      try {
        // THE LOCK SCREEN MAGIC 
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrack.title,
            artist: currentTrack.artist,
            artwork: [
              { src: currentTrack.image, sizes: '512x512', type: 'image/jpeg' }
            ]
          });

          // Connect lock screen buttons to our brain
          navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
          navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
          navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack());
          navigator.mediaSession.setActionHandler('previoustrack', () => playPreviousTrack());
        }

        const resolvedUrl = await getBestAudioStreamUrl(currentTrack.id, currentTrack.downloadUrl, audioQuality);
        if (currentLoadToken !== loadTokenRef.current) {
          return;
        }

        if (resolvedUrl) {
          audio.src = resolvedUrl;
          audio.currentTime = 0;
          audio.load();
          await audio.play();
          if (currentLoadToken !== loadTokenRef.current) {
            return;
          }
          setIsPlaying(true); 
        } else {
          if (currentLoadToken !== loadTokenRef.current) {
            return;
          }
          console.error('[AudioEngine] Extraction failed - no audio stream URL in response');
          // Auto-pause to prevent UI confusion
          setIsPlaying(false);
        }
      } catch (error) {
        if (currentLoadToken !== loadTokenRef.current) {
          return;
        }
        console.error("[AudioEngine] Error in playSong:", error);
        setIsPlaying(false);
      }
    };

    playSong();
  }, [
    audioQuality,
    currentTrack,
    playNextTrack,
    playPreviousTrack,
    setDuration,
    setIsPlaying,
    setProgress,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying && audio.src) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    const updateTime = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleSongEnd = () => playNextTrack();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleSongEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleSongEnd);
    }
  }, [playNextTrack, setProgress, setDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (seekTime === null || !audio.src) return;

    const durationOrSeekTime = Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration
      : seekTime;
    const nextTime = Math.max(0, Math.min(seekTime, durationOrSeekTime));
    audio.currentTime = nextTime;
    setProgress(nextTime);
    clearSeek();
  }, [clearSeek, seekTime, setProgress]);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  return null; 
};

export default AudioEngine;
