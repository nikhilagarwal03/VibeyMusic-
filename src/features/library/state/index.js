/**
 * Library feature state
 * Links to library slice in Zustand store
 */

import { usePlayerStore } from '../../../store/usePlayerStore';

// Library state selectors
export const useLibraryState = () => usePlayerStore((state) => ({
  likedSongs: state.likedSongs,
  likedCollections: state.likedCollections,
  recentlyPlayedSongs: state.recentlyPlayedSongs,
  downloadedTracks: state.downloadedTracks,
  customPlaylists: state.customPlaylists,
}));

// Library actions
export const useLibraryActions = () => usePlayerStore((state) => ({
  toggleLikeSong: state.toggleLike,
  toggleLikeCollection: state.toggleLikeCollection,
  addRecentlyPlayedCollection: state.addRecentlyPlayedCollection,
  downloadTrack: state.downloadTrack,
  removeDownloadedTrack: state.removeDownloadedTrack,
  createCustomPlaylist: state.createCustomPlaylist,
  renameCustomPlaylist: state.renameCustomPlaylist,
  deleteCustomPlaylist: state.deleteCustomPlaylist,
  addTrackToPlaylist: state.addTrackToPlaylist,
  removeTrackFromPlaylist: state.removeTrackFromPlaylist,
}));

// Convenience re-exports
export { usePlayerStore };
