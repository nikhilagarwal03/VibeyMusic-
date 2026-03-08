import React, { useEffect, useMemo, useState } from 'react';
import { usePlayerStore } from '../../../store/usePlayerStore';
import vibeyLogo from '../../../assets/img1.png';

const formatPlaybackTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatRelativeTime = (diffMs) => {
  if (!Number.isFinite(diffMs) || diffMs < 10_000) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const MobileBrandBar = ({ isSearching }) => {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const progress = usePlayerStore((state) => state.progress);

  const [isAppVisible, setIsAppVisible] = useState(
    typeof document === 'undefined' ? true : !document.hidden
  );
  const [lastActivityAt, setLastActivityAt] = useState(0);
  const [statusClock, setStatusClock] = useState(0);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const startedAt = Date.now();
    const initTimer = window.setTimeout(() => {
      setLastActivityAt(startedAt);
      setStatusClock(startedAt);
    }, 0);

    const setVisible = () => {
      setIsAppVisible(!document.hidden);
      setLastActivityAt(Date.now());
    };

    const setFocused = () => {
      setIsAppVisible(true);
      setLastActivityAt(Date.now());
    };

    const setBlurred = () => {
      setIsAppVisible(false);
      setLastActivityAt(Date.now());
    };

    document.addEventListener('visibilitychange', setVisible);
    window.addEventListener('focus', setFocused);
    window.addEventListener('blur', setBlurred);

    return () => {
      window.clearTimeout(initTimer);
      document.removeEventListener('visibilitychange', setVisible);
      window.removeEventListener('focus', setFocused);
      window.removeEventListener('blur', setBlurred);
    };
  }, []);

  useEffect(() => {
    const activityTimer = window.setTimeout(() => {
      setLastActivityAt(Date.now());
    }, 0);

    return () => window.clearTimeout(activityTimer);
  }, [isPlaying, isSearching, currentTrack?.id]);

  useEffect(() => {
    const intervalMs = isPlaying ? 1000 : 15_000;
    const timer = window.setInterval(() => {
      setStatusClock(Date.now());
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const mobileStatus = useMemo(() => {
    const sinceLastActivity = statusClock - lastActivityAt;

    if (!isAppVisible) {
      return {
        label: 'Background',
        detail: formatRelativeTime(sinceLastActivity),
        tone: 'idle'
      };
    }

    if (isSearching) {
      return {
        label: 'Searching',
        detail: 'live',
        tone: 'busy'
      };
    }

    if (isPlaying && currentTrack) {
      return {
        label: 'Playing',
        detail: formatPlaybackTime(progress),
        tone: 'playing'
      };
    }

    if (currentTrack) {
      return {
        label: 'Paused',
        detail: formatRelativeTime(sinceLastActivity),
        tone: 'idle'
      };
    }

    return {
      label: 'Active',
      detail: formatRelativeTime(sinceLastActivity),
      tone: 'active'
    };
  }, [currentTrack, isAppVisible, isPlaying, isSearching, lastActivityAt, progress, statusClock]);

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 pt-2 pb-2 bg-black/35 backdrop-blur-xl border-b border-white/5">
      <div className="mobile-brand-pill">
        <div className="mobile-brand-left">
          <img src={vibeyLogo} alt="Vibey Music" className="mobile-brand-logo" />
          <h1 className="mobile-brand-title">Vibey Music</h1>
        </div>

        <div className="mobile-brand-right">
          <div className="mobile-brand-status-row">
            <span className={`mobile-brand-status-dot mobile-brand-status-dot--${mobileStatus.tone}`} />
            <span className="mobile-brand-status-text">{mobileStatus.label}</span>
          </div>
          <span className="mobile-brand-status-detail">{mobileStatus.detail}</span>
        </div>
      </div>
    </div>
  );
};

export default MobileBrandBar;
