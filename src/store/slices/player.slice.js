import { createRecentTrackItem, normalizeQueueTracks, pushRecentItem } from './helpers';

export const createPlayerSlice = (set) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 1,
  progress: 0,
  duration: 0,
  seekTime: null,
  isMobilePlayerOpen: false,
  playbackQueue: [],
  currentQueueIndex: -1,
  queueSourceType: 'none',
  queueSourceTitle: '',
  repeatMode: 'off',
  shuffleEnabled: false,

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTrack: (track) =>
    set((state) => {
      const nextQueueIndex = state.playbackQueue.findIndex((queueTrack) => queueTrack.id === track?.id);
      const isQueueTrack = nextQueueIndex >= 0;

      return {
        currentTrack: track,
        isPlaying: true,
        progress: 0,
        duration: 0,
        seekTime: null,
        currentQueueIndex: nextQueueIndex,
        playbackQueue: isQueueTrack ? state.playbackQueue : [],
        queueSourceType: isQueueTrack ? state.queueSourceType : 'none',
        queueSourceTitle: isQueueTrack ? state.queueSourceTitle : '',
        recentlyPlayedSongs: pushRecentItem(
          state.recentlyPlayedSongs,
          createRecentTrackItem(track)
        )
      };
    }),
  startPlaylistPlayback: ({
    tracks,
    startIndex = 0,
    playlistTitle = '',
    openPlayer = false,
    sourceType = 'playlist'
  }) =>
    set((state) => {
      const normalizedTracks = normalizeQueueTracks(tracks);
      if (normalizedTracks.length === 0) {
        return {};
      }

      const nextIndex = Math.max(0, Math.min(normalizedTracks.length - 1, Number(startIndex) || 0));
      const nextTrack = normalizedTracks[nextIndex];
      const normalizedSourceType = sourceType === 'album' ? 'album' : 'playlist';

      return {
        playbackQueue: normalizedTracks,
        currentQueueIndex: nextIndex,
        queueSourceType: normalizedSourceType,
        queueSourceTitle: String(playlistTitle || '').trim(),
        currentTrack: nextTrack,
        isPlaying: true,
        progress: 0,
        duration: 0,
        seekTime: null,
        isMobilePlayerOpen: openPlayer ? true : state.isMobilePlayerOpen,
        recentlyPlayedSongs: pushRecentItem(
          state.recentlyPlayedSongs,
          createRecentTrackItem(nextTrack)
        )
      };
    }),
  playTrackFromQueue: (index) =>
    set((state) => {
      if (!Array.isArray(state.playbackQueue) || state.playbackQueue.length === 0) {
        return {};
      }

      const nextIndex = Number(index);
      if (!Number.isFinite(nextIndex) || nextIndex < 0 || nextIndex >= state.playbackQueue.length) {
        return {};
      }

      const nextTrack = state.playbackQueue[nextIndex];

      return {
        currentQueueIndex: nextIndex,
        currentTrack: nextTrack,
        isPlaying: true,
        progress: 0,
        duration: 0,
        seekTime: null,
        recentlyPlayedSongs: pushRecentItem(
          state.recentlyPlayedSongs,
          createRecentTrackItem(nextTrack)
        )
      };
    }),
  playNextTrack: () =>
    set((state) => {
      if (!Array.isArray(state.playbackQueue) || state.playbackQueue.length === 0) {
        return { isPlaying: false };
      }

      if (state.repeatMode === 'one' && state.currentQueueIndex >= 0) {
        const currentTrack = state.playbackQueue[state.currentQueueIndex] || state.currentTrack;
        if (!currentTrack) {
          return { isPlaying: false };
        }

        return {
          currentTrack,
          isPlaying: true,
          progress: 0,
          duration: 0,
          seekTime: null,
        };
      }

      if (state.shuffleEnabled && state.playbackQueue.length > 1) {
        const candidates = state.playbackQueue
          .map((_track, index) => index)
          .filter((index) => index !== state.currentQueueIndex);
        const randomIndex = candidates[Math.floor(Math.random() * candidates.length)];
        const randomTrack = state.playbackQueue[randomIndex];

        if (!randomTrack) {
          return { isPlaying: false };
        }

        return {
          currentQueueIndex: randomIndex,
          currentTrack: randomTrack,
          isPlaying: true,
          progress: 0,
          duration: 0,
          seekTime: null,
          recentlyPlayedSongs: pushRecentItem(
            state.recentlyPlayedSongs,
            createRecentTrackItem(randomTrack)
          )
        };
      }

      const nextIndex = state.currentQueueIndex + 1;
      if (nextIndex < 0 || nextIndex >= state.playbackQueue.length) {
        if (state.repeatMode === 'all' && state.playbackQueue.length > 0) {
          const firstTrack = state.playbackQueue[0];
          return {
            currentQueueIndex: 0,
            currentTrack: firstTrack,
            isPlaying: true,
            progress: 0,
            duration: 0,
            seekTime: null,
            recentlyPlayedSongs: pushRecentItem(
              state.recentlyPlayedSongs,
              createRecentTrackItem(firstTrack)
            )
          };
        }

        return { isPlaying: false };
      }

      const nextTrack = state.playbackQueue[nextIndex];

      return {
        currentQueueIndex: nextIndex,
        currentTrack: nextTrack,
        isPlaying: true,
        progress: 0,
        duration: 0,
        seekTime: null,
        recentlyPlayedSongs: pushRecentItem(
          state.recentlyPlayedSongs,
          createRecentTrackItem(nextTrack)
        )
      };
    }),
  playPreviousTrack: () =>
    set((state) => {
      if (!Array.isArray(state.playbackQueue) || state.playbackQueue.length === 0) {
        return {};
      }

      if (state.shuffleEnabled && state.playbackQueue.length > 1) {
        const candidates = state.playbackQueue
          .map((_track, index) => index)
          .filter((index) => index !== state.currentQueueIndex);
        const randomIndex = candidates[Math.floor(Math.random() * candidates.length)];
        const randomTrack = state.playbackQueue[randomIndex];

        if (!randomTrack) {
          return {};
        }

        return {
          currentQueueIndex: randomIndex,
          currentTrack: randomTrack,
          isPlaying: true,
          progress: 0,
          duration: 0,
          seekTime: null,
          recentlyPlayedSongs: pushRecentItem(
            state.recentlyPlayedSongs,
            createRecentTrackItem(randomTrack)
          )
        };
      }

      const previousIndex = state.currentQueueIndex - 1;
      if (previousIndex < 0 || previousIndex >= state.playbackQueue.length) {
        if (state.repeatMode === 'all' && state.playbackQueue.length > 0) {
          const lastIndex = state.playbackQueue.length - 1;
          const lastTrack = state.playbackQueue[lastIndex];
          return {
            currentQueueIndex: lastIndex,
            currentTrack: lastTrack,
            isPlaying: true,
            progress: 0,
            duration: 0,
            seekTime: null,
            recentlyPlayedSongs: pushRecentItem(
              state.recentlyPlayedSongs,
              createRecentTrackItem(lastTrack)
            )
          };
        }

        return {};
      }

      const previousTrack = state.playbackQueue[previousIndex];

      return {
        currentQueueIndex: previousIndex,
        currentTrack: previousTrack,
        isPlaying: true,
        progress: 0,
        duration: 0,
        seekTime: null,
        recentlyPlayedSongs: pushRecentItem(
          state.recentlyPlayedSongs,
          createRecentTrackItem(previousTrack)
        )
      };
    }),

  setVolume: (level) => set({ volume: level }),
  setProgress: (time) => set({ progress: time }),
  requestSeek: (time) =>
    set((state) => ({
      progress: Math.max(0, Math.min(Number(time) || 0, Number(state.duration) || Number(time) || 0)),
      seekTime: Number(time) || 0
    })),
  clearSeek: () => set({ seekTime: null }),
  setDuration: (time) => set({ duration: time }),
  setMobilePlayerOpen: (isOpen) => set({ isMobilePlayerOpen: isOpen }),
  toggleRepeatMode: () =>
    set((state) => {
      const nextMode = state.repeatMode === 'off'
        ? 'all'
        : state.repeatMode === 'all'
          ? 'one'
          : 'off';

      return { repeatMode: nextMode };
    }),
  toggleShuffle: () => set((state) => ({ shuffleEnabled: !state.shuffleEnabled })),
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  setShuffleEnabled: (enabled) => set({ shuffleEnabled: Boolean(enabled) }),
});
