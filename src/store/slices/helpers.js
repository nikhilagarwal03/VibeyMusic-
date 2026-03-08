export const DEFAULT_QUICK_SEARCH_SUGGESTIONS = [
  'Karan Aujla',
  'Arijit Singh',
  'Sonu Nigam',
  'Diljit Dosanjh',
  'Dhanda Nyoliwala'
];

export const RECENT_ITEMS_LIMIT = 40;
export const DOWNLOAD_ITEMS_LIMIT = 200;
export const PLAYLIST_ITEMS_LIMIT = 100;
export const DEFAULT_PLAYLIST_NAME = 'My Playlist';

export const normalizeQuickSuggestions = (suggestions = []) => {
  const unique = [];

  suggestions.forEach((value) => {
    const clean = String(value || '').trim();
    if (!clean) return;
    if (!unique.includes(clean)) {
      unique.push(clean);
    }
  });

  if (unique.length === 0) {
    return DEFAULT_QUICK_SEARCH_SUGGESTIONS;
  }

  return unique.slice(0, 12);
};

export const normalizeQuickSearchLimit = (value) => {
  const nextValue = Number.parseInt(value, 10);
  if (!Number.isFinite(nextValue)) return 5;
  return Math.max(1, Math.min(12, nextValue));
};

export const normalizePlayerBackgroundMode = (value) =>
  value === 'dominant-only' ? 'dominant-only' : 'cover-and-dominant';

export const normalizeHomeRecentSectionMode = (value) =>
  value === 'recently-liked' ? 'recently-liked' : 'recently-played';

export const normalizePlaylistOpenMode = (value) =>
  value === 'open-player' ? 'open-player' : 'stay-in-view';

export const normalizeRepeatMode = (value) => {
  if (value === 'all' || value === 'one') return value;
  return 'off';
};

export const normalizeShuffleEnabled = (value) => Boolean(value);

export const normalizeQueueTracks = (tracks = []) =>
  Array.isArray(tracks)
    ? tracks.filter((track) => Boolean(track?.id))
    : [];

export const getRecentItemKey = (item) => {
  if (!item?.id) return '';
  const type = item.entityType || 'song';
  return `${type}:${item.id}`;
};

export const createRecentTrackItem = (track) => {
  if (!track?.id) return null;

  return {
    id: track.id,
    entityType: 'song',
    title: track.title || '',
    subtitle: track.artist || '',
    image: track.image || '',
    playedAt: Date.now(),
    trackData: track
  };
};

export const createRecentCollectionItem = (item) => {
  if (!item?.id) return null;
  if (!['playlist', 'album', 'artist'].includes(item?.type)) return null;

  return {
    id: item.id,
    entityType: item.type,
    title: item.title || '',
    subtitle: item.subtitle || item.type,
    image: item.image || '',
    playedAt: Date.now(),
    collectionData: item
  };
};

export const pushRecentItem = (previousItems = [], item) => {
  if (!item?.id) return previousItems;

  const itemKey = getRecentItemKey(item);
  if (!itemKey) return previousItems;

  const deduped = previousItems.filter((existingItem) => getRecentItemKey(existingItem) !== itemKey);
  return [item, ...deduped].slice(0, RECENT_ITEMS_LIMIT);
};

export const normalizeRecentlyPlayedItems = (value = []) => {
  if (!Array.isArray(value)) return [];

  const normalized = [];
  value.forEach((item) => {
    if (item?.entityType && item?.id) {
      normalized.push(item);
      return;
    }

    if (item?.id) {
      const recentTrackItem = createRecentTrackItem(item);
      if (recentTrackItem) {
        normalized.push(recentTrackItem);
      }
    }
  });

  return normalized.slice(0, RECENT_ITEMS_LIMIT);
};

export const normalizeDownloadedTracks = (value = []) => {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const normalized = [];

  value.forEach((track) => {
    const id = String(track?.id || '').trim();
    if (!id || seen.has(id)) return;

    seen.add(id);
    normalized.push({
      id,
      title: String(track?.title || ''),
      artist: String(track?.artist || ''),
      image: String(track?.image || ''),
      downloadUrl: Array.isArray(track?.downloadUrl) ? track.downloadUrl : [],
      durationSec: Number(track?.durationSec) || 0,
      language: String(track?.language || ''),
      label: String(track?.label || ''),
      downloadedAt: Number(track?.downloadedAt) || Date.now(),
    });
  });

  return normalized.slice(0, DOWNLOAD_ITEMS_LIMIT);
};

export const createDefaultPlaylist = () => ({
  id: 'playlist-default',
  name: DEFAULT_PLAYLIST_NAME,
  tracks: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const normalizeCustomPlaylists = (value = []) => {
  if (!Array.isArray(value) || value.length === 0) {
    return [createDefaultPlaylist()];
  }

  const normalized = value
    .filter((playlist) => String(playlist?.id || '').trim())
    .map((playlist) => ({
      id: String(playlist.id),
      name: String(playlist?.name || 'Untitled Playlist').trim() || 'Untitled Playlist',
      tracks: normalizeDownloadedTracks(playlist?.tracks || []),
      createdAt: Number(playlist?.createdAt) || Date.now(),
      updatedAt: Number(playlist?.updatedAt) || Date.now(),
    }))
    .slice(0, PLAYLIST_ITEMS_LIMIT);

  if (normalized.length === 0) {
    return [createDefaultPlaylist()];
  }

  return normalized;
};
