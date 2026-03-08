import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAlbumByIdOrLink,
  getArtistAlbumsById,
  getArtistByIdDetails,
  getArtistByIdOrLink,
  getArtistSongsById,
  getPlaylistByIdOrLink,
  searchAll,
  searchAlbums,
  searchPlaylists,
  searchTracks,
} from '../../../lib/api';

const EMPTY_RESULTS = { songs: [], albums: [], artists: [], playlists: [] };

export const SEARCH_TYPE_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'songs', label: 'Songs' },
  { id: 'albums', label: 'Albums' },
  { id: 'playlists', label: 'Playlists' }
];

const useSearchView = ({
  imageQuality,
  setActiveView,
  quickSearchSuggestions = [],
  addRecentlyPlayedCollection
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const inputRef = useRef(null);
  const minimumSearchLength = 2;
  const normalizedDebouncedQuery = String(debouncedQuery || '').trim();
  const shouldSearch = normalizedDebouncedQuery.length >= minimumSearchLength;

  useEffect(() => {
    const debounceTimer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 450);

    return () => window.clearTimeout(debounceTimer);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ['search', searchType, normalizedDebouncedQuery, imageQuality],
    queryFn: async () => {
      if (searchType === 'all') {
        const groupedResults = await searchAll(normalizedDebouncedQuery, { imageQuality });
        return {
          results: [],
          allResults: groupedResults,
        };
      }

      if (searchType === 'songs') {
        const filteredResults = await searchTracks(normalizedDebouncedQuery, { imageQuality });
        return {
          results: filteredResults,
          allResults: EMPTY_RESULTS,
        };
      }

      if (searchType === 'albums') {
        const filteredResults = await searchAlbums(normalizedDebouncedQuery, { imageQuality });
        return {
          results: filteredResults,
          allResults: EMPTY_RESULTS,
        };
      }

      const filteredResults = await searchPlaylists(normalizedDebouncedQuery, { imageQuality });
      return {
        results: filteredResults,
        allResults: EMPTY_RESULTS,
      };
    },
    enabled: shouldSearch,
    staleTime: 30_000,
  });

  const detailQuery = useQuery({
    queryKey: ['search-detail', selectedDetailItem?.type, selectedDetailItem?.id, imageQuality],
    queryFn: async () => {
      const item = selectedDetailItem;
      if (!item?.id || !item?.type) return null;

      if (item.type === 'album') {
        const album = await getAlbumByIdOrLink({ id: item.id }, { imageQuality });

        return {
          id: album?.id || item.id,
          type: 'album',
          title: album?.title || item.title,
          subtitle: album?.subtitle || item.subtitle,
          image: album?.image || item.image || '',
          songs: album?.songs || [],
          albums: [],
        };
      }

      if (item.type === 'playlist') {
        const playlist = await getPlaylistByIdOrLink({ id: item.id }, { imageQuality });

        return {
          id: playlist?.id || item.id,
          type: 'playlist',
          title: playlist?.title || item.title,
          subtitle: playlist?.subtitle || item.subtitle,
          image: playlist?.image || item.image || '',
          songs: playlist?.songs || [],
          albums: [],
        };
      }

      if (item.type === 'artist') {
        const [artistSummary, artistDetails, artistSongs, artistAlbums] = await Promise.all([
          getArtistByIdOrLink({ id: item.id }, { imageQuality }),
          getArtistByIdDetails(item.id, { imageQuality }),
          getArtistSongsById(item.id, { imageQuality }),
          getArtistAlbumsById(item.id, { imageQuality }),
        ]);

        return {
          id: artistDetails?.id || artistSummary?.id || item.id,
          type: 'artist',
          title: artistDetails?.title || artistSummary?.title || item.title,
          subtitle: artistDetails?.subtitle || artistSummary?.subtitle || item.subtitle,
          image: artistDetails?.image || artistSummary?.image || item.image || '',
          songs: artistSongs?.songs || artistDetails?.topSongs || [],
          albums: artistAlbums?.albums || artistDetails?.topAlbums || [],
          meta: {
            followerCount: artistDetails?.followerCount || artistSummary?.followerCount,
          },
        };
      }

      return null;
    },
    enabled: Boolean(selectedDetailItem?.id && selectedDetailItem?.type),
    staleTime: 60_000,
  });

  const searchData = searchQuery.data || { results: [], allResults: EMPTY_RESULTS };
  const results = searchData.results;
  const allResults = searchData.allResults;
  const searchError = shouldSearch && searchQuery.isError
    ? `Failed to search: ${searchQuery.error?.message || 'unknown error'}`
    : null;
  const isSearching = shouldSearch ? searchQuery.isFetching : false;
  const detailPanel = detailQuery.data || null;
  const isDetailLoading = detailQuery.isLoading || detailQuery.isFetching;
  const detailError = detailQuery.isError
    ? `Failed to load ${selectedDetailItem?.type || 'item'} details: ${detailQuery.error?.message || 'unknown error'}`
    : null;

  const handleSearch = useCallback(
    (searchQueryText) => {
      const normalizedQuery = String(searchQueryText || '').trim();
      setQuery(searchQueryText);
      setDebouncedQuery(normalizedQuery);
      setSelectedDetailItem(null);
    },
    []
  );

  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setQuery(value);
      setSelectedDetailItem(null);
    },
    []
  );

  const onSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const normalizedQuery = String(query || '').trim();
      if (!normalizedQuery) {
        setDebouncedQuery('');
        return;
      }

      setDebouncedQuery(normalizedQuery);
    },
    [query]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setActiveView('search');
        setSearchType('all');
        setSelectedDetailItem(null);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveView]);

  const onSearchTypeChange = useCallback((type) => {
    setSearchType(type);
    setSelectedDetailItem(null);
  }, []);

  const openCollectionDetail = useCallback((item) => {
    if (!item?.id || !item?.type) return;
    addRecentlyPlayedCollection?.(item);
    setSelectedDetailItem(item);
  }, [addRecentlyPlayedCollection]);

  const onBackToResults = useCallback(() => {
    setSelectedDetailItem(null);
  }, []);

  const onQuickSuggestion = useCallback(
    (suggestion) => {
      setSearchType('all');
      setQuery(suggestion);
      setDebouncedQuery(suggestion);
      setSelectedDetailItem(null);
    },
    []
  );

  const onHomeQuickSearch = useCallback(
    (value) => {
      setActiveView('search');
      setSearchType('all');
      setQuery(value);
      setDebouncedQuery(value);
      setSelectedDetailItem(null);
    },
    [setActiveView]
  );

  const allResultsCount =
    allResults.songs.length + allResults.albums.length + allResults.artists.length + allResults.playlists.length;
  const hasResults = searchType === 'all' ? allResultsCount > 0 : results.length > 0;
  const isDetailMode = Boolean(selectedDetailItem || isDetailLoading || detailError || detailPanel);

  return {
    inputRef,
    query,
    results,
    allResults,
    searchType,
    isSearching,
    searchError,
    detailPanel,
    isDetailLoading,
    detailError,
    searchTypeOptions: SEARCH_TYPE_OPTIONS,
    quickSuggestions: quickSearchSuggestions,
    hasResults,
    isDetailMode,
    handleInputChange,
    handleSearch,
    openCollectionDetail,
    onSearchTypeChange,
    onBackToResults,
    onQuickSuggestion,
    onHomeQuickSearch,
    onSearchSubmit,
    minimumSearchLength
  };
};

export default useSearchView;
