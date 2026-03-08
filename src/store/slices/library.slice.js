import {
  createRecentCollectionItem,
  DEFAULT_PLAYLIST_NAME,
  normalizeCustomPlaylists,
  normalizeDownloadedTracks,
  normalizeRecentlyPlayedItems,
  pushRecentItem,
} from './helpers';

const sanitizeTrack = (track) => {
  if (!track?.id) return null;

  return {
    id: String(track.id),
    title: String(track?.title || ''),
    artist: String(track?.artist || ''),
    image: String(track?.image || ''),
    downloadUrl: Array.isArray(track?.downloadUrl) ? track.downloadUrl : [],
    durationSec: Number(track?.durationSec) || 0,
    language: String(track?.language || ''),
    label: String(track?.label || ''),
  };
};

const createPlaylist = (name) => ({
  id: `playlist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  name: String(name || '').trim() || DEFAULT_PLAYLIST_NAME,
  tracks: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const createLibrarySlice = (set) => ({
  likedSongs: [],
  likedCollections: [],
  recentlyPlayedSongs: [],
  downloadedTracks: [],
  customPlaylists: [createPlaylist(DEFAULT_PLAYLIST_NAME)],

  setRecentlyPlayedSongs: (items) =>
    set({ recentlyPlayedSongs: normalizeRecentlyPlayedItems(items) }),
  setDownloadedTracks: (items) => set({ downloadedTracks: normalizeDownloadedTracks(items) }),
  setCustomPlaylists: (items) => set({ customPlaylists: normalizeCustomPlaylists(items) }),
  downloadTrack: (track) =>
    set((state) => {
      const normalized = sanitizeTrack(track);
      if (!normalized) return {};

      const exists = state.downloadedTracks.some((item) => item.id === normalized.id);
      if (exists) return {};

      return {
        downloadedTracks: normalizeDownloadedTracks([
          { ...normalized, downloadedAt: Date.now() },
          ...state.downloadedTracks,
        ]),
      };
    }),
  removeDownloadedTrack: (trackId) =>
    set((state) => ({
      downloadedTracks: state.downloadedTracks.filter((track) => track.id !== trackId),
      customPlaylists: state.customPlaylists.map((playlist) => ({
        ...playlist,
        tracks: playlist.tracks.filter((track) => track.id !== trackId),
        updatedAt: Date.now(),
      })),
    })),
  createCustomPlaylist: (name) =>
    set((state) => ({
      customPlaylists: [...state.customPlaylists, createPlaylist(name)],
    })),
  renameCustomPlaylist: (playlistId, name) =>
    set((state) => ({
      customPlaylists: state.customPlaylists.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              name: String(name || '').trim() || playlist.name,
              updatedAt: Date.now(),
            }
          : playlist
      ),
    })),
  deleteCustomPlaylist: (playlistId) =>
    set((state) => {
      const nextPlaylists = state.customPlaylists.filter((playlist) => playlist.id !== playlistId);
      if (nextPlaylists.length > 0) {
        return { customPlaylists: nextPlaylists };
      }

      return { customPlaylists: [createPlaylist(DEFAULT_PLAYLIST_NAME)] };
    }),
  addTrackToPlaylist: (playlistId, track) =>
    set((state) => {
      const normalized = sanitizeTrack(track);
      if (!normalized) return {};

      return {
        customPlaylists: state.customPlaylists.map((playlist) => {
          if (playlist.id !== playlistId) return playlist;

          const exists = playlist.tracks.some((item) => item.id === normalized.id);
          if (exists) return playlist;

          return {
            ...playlist,
            tracks: [{ ...normalized }, ...playlist.tracks],
            updatedAt: Date.now(),
          };
        }),
      };
    }),
  removeTrackFromPlaylist: (playlistId, trackId) =>
    set((state) => ({
      customPlaylists: state.customPlaylists.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              tracks: playlist.tracks.filter((track) => track.id !== trackId),
              updatedAt: Date.now(),
            }
          : playlist
      ),
    })),
  addRecentlyPlayedCollection: (item) =>
    set((state) => ({
      recentlyPlayedSongs: pushRecentItem(
        state.recentlyPlayedSongs,
        createRecentCollectionItem(item)
      )
    })),
  clearRecentlyPlayedSongs: () => set({ recentlyPlayedSongs: [] }),
  toggleLikeCollection: (item) =>
    set((state) => {
      if (!item?.id || !item?.type) {
        return {};
      }

      const nextCollection = {
        id: item.id,
        type: item.type,
        title: item.title || '',
        subtitle: item.subtitle || item.type,
        image: item.image || ''
      };

      const isAlreadyLiked = state.likedCollections.some(
        (collection) => collection.id === nextCollection.id && collection.type === nextCollection.type
      );

      if (isAlreadyLiked) {
        return {
          likedCollections: state.likedCollections.filter(
            (collection) => !(collection.id === nextCollection.id && collection.type === nextCollection.type)
          )
        };
      }

      return {
        likedCollections: [...state.likedCollections, nextCollection]
      };
    }),

  toggleLike: (track) => set((state) => {
    const isLiked = state.likedSongs.some(t => t.id === track.id);
    if (isLiked) {
      return { likedSongs: state.likedSongs.filter(t => t.id !== track.id) };
    }

    return { likedSongs: [...state.likedSongs, track] };
  }),
});
