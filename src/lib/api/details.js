import { request } from './client';
import {
  mapAlbumDetail,
  mapArtistAlbumsPayload,
  mapArtistSongsPayload,
  mapArtistSummary,
  mapPlaylistDetail
} from './mappers';

export const getAlbumByIdOrLink = async ({ id, link }, options = {}) => {
  if (!id && !link) return null;

  const imageQuality = options.imageQuality || '500x500';
  const payload = await request('/albums', { id, link });
  const album = payload?.data;

  if (!album || typeof album !== 'object') {
    throw new Error('Invalid response format from album endpoint');
  }

  return mapAlbumDetail(album, imageQuality);
};

export const getPlaylistByIdOrLink = async ({ id, link }, options = {}) => {
  if (!id && !link) return null;

  const imageQuality = options.imageQuality || '500x500';
  const pageSize = 100;
  const firstPayload = await request('/playlists', { id, link, page: 0, limit: pageSize });
  const firstPlaylist = firstPayload?.data;

  if (!firstPlaylist || typeof firstPlaylist !== 'object') {
    throw new Error('Invalid response format from playlist endpoint');
  }

  const totalSongs = Number.parseInt(firstPlaylist?.songCount, 10) || 0;
  const collectedSongs = Array.isArray(firstPlaylist?.songs) ? [...firstPlaylist.songs] : [];
  const seenSongIds = new Set(collectedSongs.map((song) => song?.id).filter(Boolean));
  const totalPages = Math.max(1, Math.ceil(totalSongs / pageSize));
  const maxConcurrentPageRequests = 3;

  if (totalSongs > collectedSongs.length && totalPages > 1) {
    const pendingPages = Array.from({ length: totalPages - 1 }, (_, index) => index + 1);

    const fetchNextPage = async () => {
      while (pendingPages.length > 0) {
        const page = pendingPages.shift();
        if (page === undefined) return;

        const nextPayload = await request('/playlists', { id, link, page, limit: pageSize });
        const nextPlaylist = nextPayload?.data;
        const nextSongs = Array.isArray(nextPlaylist?.songs) ? nextPlaylist.songs : [];

        if (nextSongs.length === 0) {
          continue;
        }

        nextSongs.forEach((song) => {
          if (!song?.id) return;
          if (seenSongIds.has(song.id)) return;

          seenSongIds.add(song.id);
          collectedSongs.push(song);
        });
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(maxConcurrentPageRequests, pendingPages.length) }, () => fetchNextPage())
    );
  }

  const playlist = {
    ...firstPlaylist,
    songs: collectedSongs
  };

  if (!playlist || typeof playlist !== 'object') {
    throw new Error('Invalid response format from playlist endpoint');
  }

  return mapPlaylistDetail(playlist, imageQuality);
};

export const getArtistByIdOrLink = async ({ id, link }, options = {}) => {
  if (!id && !link) return null;

  const imageQuality = options.imageQuality || '500x500';
  const payload = await request('/artists', {
    id,
    link,
    page: 0,
    songCount: 10,
    albumCount: 10,
    sortBy: 'popularity',
    sortOrder: 'desc'
  });
  const artist = payload?.data;

  if (!artist || typeof artist !== 'object') {
    throw new Error('Invalid response format from artists endpoint');
  }

  return mapArtistSummary(artist, imageQuality);
};

export const getArtistByIdDetails = async (artistId, options = {}) => {
  if (!artistId) return null;

  const imageQuality = options.imageQuality || '500x500';
  const payload = await request(`/artists/${encodeURIComponent(artistId)}`, {
    page: 0,
    songCount: 10,
    albumCount: 10,
    sortBy: 'popularity',
    sortOrder: 'desc'
  });
  const artist = payload?.data;

  if (!artist || typeof artist !== 'object') {
    throw new Error('Invalid response format from artist by id endpoint');
  }

  return mapArtistSummary(artist, imageQuality);
};

export const getArtistSongsById = async (artistId, options = {}) => {
  if (!artistId) return { total: 0, songs: [] };

  const imageQuality = options.imageQuality || '500x500';
  const payload = await request(`/artists/${encodeURIComponent(artistId)}/songs`, {
    page: 0,
    sortBy: 'popularity',
    sortOrder: 'desc'
  });

  return mapArtistSongsPayload(payload?.data, imageQuality);
};

export const getArtistAlbumsById = async (artistId, options = {}) => {
  if (!artistId) return { total: 0, albums: [] };

  const imageQuality = options.imageQuality || '500x500';
  const payload = await request(`/artists/${encodeURIComponent(artistId)}/albums`, {
    page: 0,
    sortBy: 'popularity',
    sortOrder: 'desc'
  });

  return mapArtistAlbumsPayload(payload?.data, imageQuality);
};

export const getSongMetadataById = async (songId) => {
  if (!songId) return null;

  const payload = await request(`/songs/${encodeURIComponent(songId)}`);
  const song = Array.isArray(payload?.data) ? payload.data[0] : null;

  if (!song || typeof song !== 'object') {
    return null;
  }

  return {
    id: song.id,
    title: song.name || '',
    hasLyrics: Boolean(song.hasLyrics),
    lyricsId: song.lyricsId || null,
    language: song.language || '',
  };
};
