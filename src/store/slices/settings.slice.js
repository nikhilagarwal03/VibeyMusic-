import {
  DEFAULT_QUICK_SEARCH_SUGGESTIONS,
  normalizeHomeRecentSectionMode,
  normalizePlayerBackgroundMode,
  normalizePlaylistOpenMode,
  normalizeQuickSearchLimit,
  normalizeQuickSuggestions,
} from './helpers';

export const createSettingsSlice = (set) => ({
  audioQuality: '320kbps',
  imageQuality: '500x500',
  activeView: 'home',
  defaultStartView: 'home',
  quickSearchSuggestions: DEFAULT_QUICK_SEARCH_SUGGESTIONS,
  quickSearchLimit: 5,
  playerBackgroundMode: 'cover-and-dominant',
  homeRecentSectionMode: 'recently-played',
  playlistOpenMode: 'stay-in-view',

  setAudioQuality: (quality) => set({ audioQuality: quality }),
  setImageQuality: (quality) => set({ imageQuality: quality }),
  setActiveView: (view) => set({ activeView: view }),
  setDefaultStartView: (view) => set({ defaultStartView: view }),
  setQuickSearchSuggestions: (suggestions) =>
    set({ quickSearchSuggestions: normalizeQuickSuggestions(suggestions) }),
  setQuickSearchLimit: (limit) => set({ quickSearchLimit: normalizeQuickSearchLimit(limit) }),
  setPlayerBackgroundMode: (mode) =>
    set({ playerBackgroundMode: normalizePlayerBackgroundMode(mode) }),
  setHomeRecentSectionMode: (mode) =>
    set({ homeRecentSectionMode: normalizeHomeRecentSectionMode(mode) }),
  setPlaylistOpenMode: (mode) =>
    set({ playlistOpenMode: normalizePlaylistOpenMode(mode) }),
});
