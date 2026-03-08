/**
 * Player feature state
 * Links to player slice in Zustand store
 */

import { usePlayerStore } from '../../../store/usePlayerStore';

// Player state selectors
export const usePlayerState = () => usePlayerStore((state) => ({
  currentTrack: state.currentTrack,
  isPlaying: state.isPlaying,
  progress: state.progress,
  duration: state.duration,
  volume: state.volume,
  seekTime: state.seekTime,
  queue: state.playbackQueue,
  queueIndex: state.currentQueueIndex,
  repeatMode: state.repeatMode,
  shuffleEnabled: state.shuffleEnabled,
}));

// Player actions
export const usePlayerActions = () => usePlayerStore((state) => ({
  selectTrack: state.setCurrentTrack,
  selectTrackFromQueue: state.playTrackFromQueue,
  togglePlayPause: state.togglePlay,
  setIsPlaying: state.setIsPlaying,
  setProgress: state.setProgress,
  setDuration: state.setDuration,
  setVolume: state.setVolume,
  seek: state.requestSeek,
  clearSeek: state.clearSeek,
  playNextTrack: state.playNextTrack,
  playPreviousTrack: state.playPreviousTrack,
  startPlaylistPlayback: state.startPlaylistPlayback,
  toggleRepeat: state.toggleRepeatMode,
  toggleShuffle: state.toggleShuffle,
}));

// Convenience re-exports
export { usePlayerStore };
