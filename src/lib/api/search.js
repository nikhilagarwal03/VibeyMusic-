import { request } from './client';
import {
  dedupeArtistsByName,
  mapAlbumSearchResult,
  mapArtistSearchResult,
  mapGlobalAlbumResult,
  mapGlobalArtistResult,
  mapGlobalPlaylistResult,
  mapPlaylistSearchResult,
  mapSongSearchResultToTrack,
  mapSongToTrack
} from './mappers';

export const searchTracks = async (query, options = {}) => {
  if (!query?.trim()) return [];

  const imageQuality = options.imageQuality || '500x500';

  const payload = await request('/search/songs', { query: query.trim(), page: 0, limit: 20 });
  const songs = payload?.data?.results;

  if (!Array.isArray(songs)) {
    throw new Error('Invalid response format from search endpoint');
  }

  return songs.map((song) => mapSongToTrack(song, imageQuality));
};

export const searchAlbums = async (query, options = {}) => {
  if (!query?.trim()) return [];

  const imageQuality = options.imageQuality || '500x500';
  const payload = await request('/search/albums', { query: query.trim(), page: 0, limit: 20 });
  const albums = payload?.data?.results;

  if (!Array.isArray(albums)) {
    throw new Error('Invalid response format from album search endpoint');
  }

  return albums.map((album) => mapAlbumSearchResult(album, imageQuality));
};

export const searchArtists = async (query, options = {}) => {
  if (!query?.trim()) return [];

  const imageQuality = options.imageQuality || '500x500';
  const payload = await request('/search/artists', { query: query.trim(), page: 0, limit: 20 });
  const artists = payload?.data?.results;

  if (!Array.isArray(artists)) {
    throw new Error('Invalid response format from artist search endpoint');
  }

  const mappedArtists = artists.map((artist) => mapArtistSearchResult(artist, imageQuality));
  return dedupeArtistsByName(mappedArtists, query);
};

export const searchPlaylists = async (query, options = {}) => {
  if (!query?.trim()) return [];

  const imageQuality = options.imageQuality || '500x500';
  const payload = await request('/search/playlists', { query: query.trim(), page: 0, limit: 20 });
  const playlists = payload?.data?.results;

  if (!Array.isArray(playlists)) {
    throw new Error('Invalid response format from playlist search endpoint');
  }

  return playlists.map((playlist) => mapPlaylistSearchResult(playlist, imageQuality));
};

export const searchAll = async (query, options = {}) => {
  if (!query?.trim()) {
    return {
      songs: [],
      albums: [],
      artists: [],
      playlists: []
    };
  }

  const imageQuality = options.imageQuality || '500x500';
  const payload = await request('/search', { query: query.trim() });
  const data = payload?.data || {};

  return {
    songs: Array.isArray(data?.songs?.results)
      ? data.songs.results.map((song) => mapSongSearchResultToTrack(song, imageQuality))
      : [],
    albums: Array.isArray(data?.albums?.results)
      ? data.albums.results.map((album) => mapGlobalAlbumResult(album, imageQuality))
      : [],
    artists: Array.isArray(data?.artists?.results)
      ? dedupeArtistsByName(
          data.artists.results.map((artist) => mapGlobalArtistResult(artist, imageQuality)),
          query
        )
      : [],
    playlists: Array.isArray(data?.playlists?.results)
      ? data.playlists.results.map((playlist) => mapGlobalPlaylistResult(playlist, imageQuality))
      : []
  };
};
