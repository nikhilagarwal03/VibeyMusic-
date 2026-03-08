import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from '../../../store/usePlayerStore';
import { HomeSection } from '../../home';
import { LibrarySection } from '../../library';
import { SettingsSection } from '../../settings';
import { SearchSection, useSearchView } from '../../search';
import { DesktopQueuePanel } from '../../player/ui';
import MobileBrandBar from './MobileBrandBar';

const MainView = ({ forcedView = 'home' }) => {
  const navigate = useNavigate();
  const {
    setCurrentTrack,
    likedSongs,
    likedCollections,
    toggleLikeCollection,
    recentlyPlayedSongs,
    imageQuality,
    audioQuality,
    defaultStartView,
    setAudioQuality,
    setImageQuality,
    setDefaultStartView,
    quickSearchSuggestions,
    quickSearchLimit,
    setQuickSearchSuggestions,
    setQuickSearchLimit,
    playerBackgroundMode,
    setPlayerBackgroundMode,
    homeRecentSectionMode,
    setHomeRecentSectionMode,
    clearRecentlyPlayedSongs,
    playlistOpenMode,
    setPlaylistOpenMode,
    startPlaylistPlayback,
    addRecentlyPlayedCollection,
    downloadedTracks,
    customPlaylists,
    downloadTrack,
    removeDownloadedTrack,
    createCustomPlaylist,
    renameCustomPlaylist,
    deleteCustomPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  } = usePlayerStore(
    useShallow((state) => ({
      setCurrentTrack: state.setCurrentTrack,
      likedSongs: state.likedSongs,
      likedCollections: state.likedCollections,
      toggleLikeCollection: state.toggleLikeCollection,
      recentlyPlayedSongs: state.recentlyPlayedSongs,
      imageQuality: state.imageQuality,
      audioQuality: state.audioQuality,
      defaultStartView: state.defaultStartView,
      setAudioQuality: state.setAudioQuality,
      setImageQuality: state.setImageQuality,
      setDefaultStartView: state.setDefaultStartView,
      quickSearchSuggestions: state.quickSearchSuggestions,
      quickSearchLimit: state.quickSearchLimit,
      setQuickSearchSuggestions: state.setQuickSearchSuggestions,
      setQuickSearchLimit: state.setQuickSearchLimit,
      playerBackgroundMode: state.playerBackgroundMode,
      setPlayerBackgroundMode: state.setPlayerBackgroundMode,
      homeRecentSectionMode: state.homeRecentSectionMode,
      setHomeRecentSectionMode: state.setHomeRecentSectionMode,
      clearRecentlyPlayedSongs: state.clearRecentlyPlayedSongs,
      playlistOpenMode: state.playlistOpenMode,
      setPlaylistOpenMode: state.setPlaylistOpenMode,
      startPlaylistPlayback: state.startPlaylistPlayback,
      addRecentlyPlayedCollection: state.addRecentlyPlayedCollection,
      downloadedTracks: state.downloadedTracks,
      customPlaylists: state.customPlaylists,
      downloadTrack: state.downloadTrack,
      removeDownloadedTrack: state.removeDownloadedTrack,
      createCustomPlaylist: state.createCustomPlaylist,
      renameCustomPlaylist: state.renameCustomPlaylist,
      deleteCustomPlaylist: state.deleteCustomPlaylist,
      addTrackToPlaylist: state.addTrackToPlaylist,
      removeTrackFromPlaylist: state.removeTrackFromPlaylist,
    }))
  );

  const {
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
    searchTypeOptions,
    quickSuggestions,
    hasResults,
    isDetailMode,
    handleInputChange,
    openCollectionDetail,
    onSearchTypeChange,
    onBackToResults,
    onQuickSuggestion,
    onHomeQuickSearch,
  } = useSearchView({ imageQuality, setActiveView: () => navigate('/search'), quickSearchSuggestions, addRecentlyPlayedCollection });

  const search = useMemo(() => ({
    inputRef,
    query,
    onInputChange: handleInputChange,
    searchTypeOptions,
    searchType,
    onSearchTypeChange,
    hasResults,
    isSearching,
    isDetailMode,
    searchError,
    results,
    allResults,
    detailPanel,
    isDetailLoading,
    detailError,
    onBackToResults,
    quickSuggestions,
    onQuickSuggestion,
    likedCollections,
    onToggleLikeCollection: toggleLikeCollection,
    onPlayCollection: (detail, startIndex = 0) => {
      const sourceType = detail?.type === 'album' ? 'album' : 'playlist';

      addRecentlyPlayedCollection({
        id: detail?.id,
        title: detail?.title,
        subtitle: detail?.subtitle,
        image: detail?.image,
        type: sourceType
      });

      startPlaylistPlayback({
        tracks: detail?.songs || [],
        startIndex,
        playlistTitle: detail?.title || '',
        openPlayer: playlistOpenMode === 'open-player',
        sourceType
      });
    }
  }), [
    addRecentlyPlayedCollection,
    allResults,
    detailError,
    detailPanel,
    handleInputChange,
    hasResults,
    inputRef,
    isDetailLoading,
    isDetailMode,
    isSearching,
    likedCollections,
    onBackToResults,
    onQuickSuggestion,
    onSearchTypeChange,
    playlistOpenMode,
    query,
    quickSuggestions,
    results,
    searchError,
    searchType,
    searchTypeOptions,
    startPlaylistPlayback,
    toggleLikeCollection,
  ]);

  const home = {
    quickSuggestions,
    quickSearchLimit,
    onQuickSearch: onHomeQuickSearch,
    likedSongs,
    recentlyPlayedSongs,
    homeRecentSectionMode,
    onClearRecentlyPlayed: clearRecentlyPlayedSongs,
    onOpenRecentCollection: (item) => {
      navigate('/search');
      openCollectionDetail(item);
    }
  };

  const settings = {
    defaultStartView,
    setDefaultStartView,
    audioQuality,
    setAudioQuality,
    imageQuality,
    setImageQuality,
    quickSearchSuggestions,
    setQuickSearchSuggestions,
    quickSearchLimit,
    setQuickSearchLimit,
    playerBackgroundMode,
    setPlayerBackgroundMode,
    homeRecentSectionMode,
    setHomeRecentSectionMode,
    playlistOpenMode,
    setPlaylistOpenMode
  };

  const library = {
    likedSongs,
    likedCollections,
    downloadedTracks,
    customPlaylists,
    onOpenCollection: (item) => {
      navigate('/search');
      openCollectionDetail(item);
    },
    onGoSearch: () => navigate('/search'),
    onDownloadTrack: downloadTrack,
    onRemoveDownloadedTrack: removeDownloadedTrack,
    onCreateCustomPlaylist: createCustomPlaylist,
    onRenameCustomPlaylist: renameCustomPlaylist,
    onDeleteCustomPlaylist: deleteCustomPlaylist,
    onAddTrackToPlaylist: addTrackToPlaylist,
    onRemoveTrackFromPlaylist: removeTrackFromPlaylist,
  };

  return (
    <div className="flex-1 h-full overflow-hidden bg-background md:flex">
      <div className="flex-1 h-full overflow-y-auto p-5 pt-24 md:p-9 pb-24">
        <MobileBrandBar isSearching={isSearching} />

        {forcedView === 'home' && (
          <HomeSection
            home={home}
            onSelectTrack={setCurrentTrack}
          />
        )}

        {forcedView === 'search' && (
          <SearchSection
            search={search}
            onSelectTrack={setCurrentTrack}
            onOpenDetail={openCollectionDetail}
          />
        )}

        {forcedView === 'library' && (
          <LibrarySection
            library={library}
            onSelectTrack={setCurrentTrack}
          />
        )}

        {forcedView === 'settings' && (
          <SettingsSection settings={settings} />
        )}
      </div>

      <DesktopQueuePanel />
    </div>
  );
};

export default MainView;
