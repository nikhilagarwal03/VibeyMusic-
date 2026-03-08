import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createLibrarySlice,
  createPlayerSlice,
  createSettingsSlice,
  normalizeHomeRecentSectionMode,
  normalizeCustomPlaylists,
  normalizeDownloadedTracks,
  normalizePlayerBackgroundMode,
  normalizePlaylistOpenMode,
  normalizeQuickSearchLimit,
  normalizeQuickSuggestions,
  normalizeRepeatMode,
  normalizeRecentlyPlayedItems,
  normalizeShuffleEnabled,
} from './slices';

export { DEFAULT_QUICK_SEARCH_SUGGESTIONS } from './slices';

export const usePlayerStore = create(
  persist(
    (set, get) => ({
      ...createPlayerSlice(set, get),
      ...createLibrarySlice(set, get),
      ...createSettingsSlice(set, get),
    }),
    {
      name: 'vibey-music-storage',
      partialize: (state) => ({
        likedSongs: state.likedSongs,
        likedCollections: state.likedCollections,
        recentlyPlayedSongs: state.recentlyPlayedSongs,
        downloadedTracks: state.downloadedTracks,
        customPlaylists: state.customPlaylists,
        homeRecentSectionMode: state.homeRecentSectionMode,
        playlistOpenMode: state.playlistOpenMode,
        defaultStartView: state.defaultStartView,
        audioQuality: state.audioQuality,
        imageQuality: state.imageQuality,
        quickSearchSuggestions: state.quickSearchSuggestions,
        quickSearchLimit: state.quickSearchLimit,
        playerBackgroundMode: state.playerBackgroundMode,
        repeatMode: state.repeatMode,
        shuffleEnabled: state.shuffleEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        const startView = state?.defaultStartView || 'home';
        state?.setActiveView?.(startView);

        const normalizedSuggestions = normalizeQuickSuggestions(state?.quickSearchSuggestions);
        const normalizedLimit = normalizeQuickSearchLimit(state?.quickSearchLimit);
        const normalizedBackgroundMode = normalizePlayerBackgroundMode(state?.playerBackgroundMode);
        const normalizedRecentSectionMode = normalizeHomeRecentSectionMode(state?.homeRecentSectionMode);
        const normalizedPlaylistOpenMode = normalizePlaylistOpenMode(state?.playlistOpenMode);
        const normalizedRecentlyPlayedItems = normalizeRecentlyPlayedItems(state?.recentlyPlayedSongs);
        const normalizedDownloadedTracks = normalizeDownloadedTracks(state?.downloadedTracks);
        const normalizedCustomPlaylists = normalizeCustomPlaylists(state?.customPlaylists);
        const normalizedRepeatMode = normalizeRepeatMode(state?.repeatMode);
        const normalizedShuffleEnabled = normalizeShuffleEnabled(state?.shuffleEnabled);
        state?.setQuickSearchSuggestions?.(normalizedSuggestions);
        state?.setQuickSearchLimit?.(normalizedLimit);
        state?.setPlayerBackgroundMode?.(normalizedBackgroundMode);
        state?.setHomeRecentSectionMode?.(normalizedRecentSectionMode);
        state?.setPlaylistOpenMode?.(normalizedPlaylistOpenMode);
        state?.setRecentlyPlayedSongs?.(normalizedRecentlyPlayedItems);
        state?.setDownloadedTracks?.(normalizedDownloadedTracks);
        state?.setCustomPlaylists?.(normalizedCustomPlaylists);
        state?.setRepeatMode?.(normalizedRepeatMode);
        state?.setShuffleEnabled?.(normalizedShuffleEnabled);
      },
    }
  )
);
