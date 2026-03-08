import { removeTitlePrefixFromArtist, sanitizeDisplayText } from './text';

const normalizeSearchText = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const pickBestImage = (imageLinks = [], preferredQuality = '500x500') => {
  if (!Array.isArray(imageLinks) || imageLinks.length === 0) return '';

  const qualityOrder = ['50x50', '150x150', '500x500'];
  const preferredIndex = Math.max(0, qualityOrder.indexOf(preferredQuality));

  const exact = imageLinks.find((link) => link?.quality === preferredQuality)?.url;
  if (exact) return exact;

  for (let index = preferredIndex; index >= 0; index -= 1) {
    const downscaled = imageLinks.find((link) => link?.quality === qualityOrder[index])?.url;
    if (downscaled) return downscaled;
  }

  for (let index = preferredIndex + 1; index < qualityOrder.length; index += 1) {
    const upscaled = imageLinks.find((link) => link?.quality === qualityOrder[index])?.url;
    if (upscaled) return upscaled;
  }

  return imageLinks[imageLinks.length - 1]?.url || imageLinks[0]?.url || '';
};

const pickArtist = (song) => {
  const primary = song?.artists?.primary;
  if (Array.isArray(primary) && primary.length > 0) {
    return primary.map((artist) => sanitizeDisplayText(artist.name)).join(', ');
  }
  return 'Unknown Artist';
};

export const mapSongToTrack = (song, imageQuality) => ({
  id: song.id,
  title: sanitizeDisplayText(song.name),
  artist: removeTitlePrefixFromArtist(song.name, pickArtist(song)),
  image: pickBestImage(song.image, imageQuality),
  downloadUrl: song.downloadUrl,
  durationSec: Number.parseInt(song.duration, 10) || 0,
  language: song.language || '',
  label: sanitizeDisplayText(song.label || '')
});

export const mapSongSearchResultToTrack = (song, imageQuality) => ({
  id: song.id,
  title: sanitizeDisplayText(song.title),
  artist: removeTitlePrefixFromArtist(song.title, sanitizeDisplayText(song.primaryArtists || song.singers || 'Unknown Artist')),
  image: pickBestImage(song.image, imageQuality),
  downloadUrl: [],
  durationSec: Number.parseInt(song.duration, 10) || 0,
  language: song.language || '',
  label: sanitizeDisplayText(song.album || '')
});

export const mapAlbumSearchResult = (album, imageQuality) => {
  const albumArtists = album?.artists?.primary?.map((artist) => artist.name).join(', ');
  const year = album?.year ? String(album.year) : '';

  return {
    id: album.id,
    title: sanitizeDisplayText(album.name || 'Unknown Album'),
    subtitle: sanitizeDisplayText([albumArtists, year].filter(Boolean).join(' • ') || 'Album'),
    image: pickBestImage(album.image, imageQuality),
    type: 'album',
    url: album.url || ''
  };
};

export const mapArtistSearchResult = (artist, imageQuality) => ({
  id: artist.id,
  title: sanitizeDisplayText(artist.name || 'Unknown Artist'),
  subtitle: sanitizeDisplayText(artist.role || 'Artist'),
  image: pickBestImage(artist.image, imageQuality),
  type: 'artist',
  url: artist.url || ''
});

export const dedupeArtistsByName = (artists = [], query = '') => {
  const queryKey = normalizeSearchText(query);
  const seen = new Map();

  artists.forEach((artist) => {
    const nameKey = normalizeSearchText(artist?.title || artist?.name || '');
    if (!nameKey) return;

    const existing = seen.get(nameKey);
    const isExact = nameKey === queryKey;

    if (!existing) {
      seen.set(nameKey, artist);
      return;
    }

    const existingExact = normalizeSearchText(existing?.title || existing?.name || '') === queryKey;

    if (!existingExact && isExact) {
      seen.set(nameKey, artist);
    }
  });

  return Array.from(seen.values());
};

export const mapPlaylistSearchResult = (playlist, imageQuality) => {
  const songCount = Number.isFinite(playlist?.songCount)
    ? `${playlist.songCount} songs`
    : null;

  return {
    id: playlist.id,
    title: sanitizeDisplayText(playlist.name || 'Unknown Playlist'),
    subtitle: sanitizeDisplayText([playlist.language, songCount].filter(Boolean).join(' • ') || 'Playlist'),
    image: pickBestImage(playlist.image, imageQuality),
    type: 'playlist',
    url: playlist.url || ''
  };
};

export const mapGlobalAlbumResult = (album, imageQuality) => ({
  id: album.id,
  title: sanitizeDisplayText(album.title || 'Unknown Album'),
  subtitle: sanitizeDisplayText([album.artist, album.year].filter(Boolean).join(' • ') || 'Album'),
  image: pickBestImage(album.image, imageQuality),
  type: 'album',
  url: album.url || ''
});

export const mapGlobalArtistResult = (artist, imageQuality) => ({
  id: artist.id,
  title: sanitizeDisplayText(artist.title || 'Unknown Artist'),
  subtitle: sanitizeDisplayText(artist.description || 'Artist'),
  image: pickBestImage(artist.image, imageQuality),
  type: 'artist',
  url: ''
});

export const mapGlobalPlaylistResult = (playlist, imageQuality) => ({
  id: playlist.id,
  title: sanitizeDisplayText(playlist.title || 'Unknown Playlist'),
  subtitle: sanitizeDisplayText(playlist.description || playlist.language || 'Playlist'),
  image: pickBestImage(playlist.image, imageQuality),
  type: 'playlist',
  url: playlist.url || ''
});

export const mapAlbumDetail = (album, imageQuality) => ({
  id: album.id,
  title: sanitizeDisplayText(album.name || 'Unknown Album'),
  subtitle: sanitizeDisplayText(
    [album?.artists?.primary?.map((artist) => sanitizeDisplayText(artist.name)).join(', '), album?.year]
      .filter(Boolean)
      .join(' • ')
  ),
  image: pickBestImage(album.image, imageQuality),
  type: 'album',
  songs: Array.isArray(album?.songs) ? album.songs.map((song) => mapSongToTrack(song, imageQuality)) : []
});

export const mapPlaylistDetail = (playlist, imageQuality) => ({
  id: playlist.id,
  title: sanitizeDisplayText(playlist.name || 'Unknown Playlist'),
  subtitle: sanitizeDisplayText(
    [playlist.language, Number.isFinite(playlist?.songCount) ? `${playlist.songCount} songs` : null]
      .filter(Boolean)
      .join(' • ')
  ),
  image: pickBestImage(playlist.image, imageQuality),
  type: 'playlist',
  songs: Array.isArray(playlist?.songs) ? playlist.songs.map((song) => mapSongToTrack(song, imageQuality)) : []
});

export const mapArtistSummary = (artist, imageQuality) => ({
  id: artist.id,
  title: sanitizeDisplayText(artist.name || 'Unknown Artist'),
  subtitle: sanitizeDisplayText(artist?.dominantLanguage || artist?.dominantType || 'Artist'),
  image: pickBestImage(artist.image, imageQuality),
  type: 'artist',
  followerCount: artist?.followerCount,
  topSongs: Array.isArray(artist?.topSongs) ? artist.topSongs.map((song) => mapSongToTrack(song, imageQuality)) : [],
  topAlbums: Array.isArray(artist?.topAlbums) ? artist.topAlbums.map((album) => mapAlbumSearchResult(album, imageQuality)) : []
});

export const mapArtistSongsPayload = (payload, imageQuality) => ({
  total: payload?.total || 0,
  songs: Array.isArray(payload?.songs) ? payload.songs.map((song) => mapSongToTrack(song, imageQuality)) : []
});

export const mapArtistAlbumsPayload = (payload, imageQuality) => ({
  total: payload?.total || 0,
  albums: Array.isArray(payload?.albums) ? payload.albums.map((album) => mapAlbumSearchResult(album, imageQuality)) : []
});
