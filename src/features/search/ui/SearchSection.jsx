import React from 'react';
import { Heart, Play, Search } from 'lucide-react';
import { sanitizeDisplayText } from '../../../lib/api';
import {
  CollectionCard,
  EmptyState,
  ErrorState,
  LoadingState,
  TrackCard,
  TrackSkeletonCard,
} from '../../../shared/ui';

const SearchSection = ({
  search,
  onSelectTrack,
  onOpenDetail
}) => {
  const {
    inputRef,
    query,
    onInputChange,
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
    onSearchSubmit,
    minimumSearchLength,
    likedCollections,
    onToggleLikeCollection,
    onPlayCollection
  } = search;

  const formatPlaylistDuration = (songs = []) => {
    const totalSeconds = songs.reduce((sum, song) => sum + (Number(song?.durationSec) || 0), 0);
    if (totalSeconds <= 0) return '0 hr 00 min';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours} hr ${String(minutes).padStart(2, '0')} min`;
  };

  const allMixedResults = (() => {
    const resultBuckets = [
      allResults.songs.map((item) => ({ kind: 'song', item })),
      allResults.playlists.map((item) => ({ kind: 'collection', item })),
      allResults.artists.map((item) => ({ kind: 'collection', item })),
      allResults.albums.map((item) => ({ kind: 'collection', item }))
    ];

    const merged = [];
    let index = 0;

    while (merged.length < 20) {
      let addedInPass = false;

      resultBuckets.forEach((bucket) => {
        if (merged.length >= 20) return;
        if (index < bucket.length) {
          merged.push(bucket[index]);
          addedInPass = true;
        }
      });

      if (!addedInPass) break;
      index += 1;
    }

    return merged;
  })();

  return (
    <div>
      <form onSubmit={onSearchSubmit} className="mb-7 relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={onInputChange}
          placeholder={`Search songs, artists... (${minimumSearchLength}+ chars, Ctrl+K)`}
          className="w-full panel-card rounded-full py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 motion-base"
        />
      </form>

      <h2 className="type-display mb-7">
        {hasResults ? 'Top Results' : 'Start Searching'}
      </h2>

      <div className="mb-5 flex flex-wrap gap-2.5">
        {searchTypeOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSearchTypeChange(option.id)}
            className={`px-4 py-2 rounded-full font-medium motion-base ${
              searchType === option.id
                ? 'chip-soft text-white border border-blue-400/40'
                : 'panel-card text-gray-300 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isSearching && !isDetailMode && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <TrackSkeletonCard key={i} />
          ))}
        </div>
      )}

      {searchError && !isDetailMode && (
        <ErrorState
          title="Search Error"
          message={searchError}
          className="mb-6"
        />
      )}

      {!isSearching && query && !hasResults && !searchError && !isDetailMode && (
        <EmptyState
          iconType="search"
          title={`No ${searchType === 'all' ? 'results' : searchType} found`}
          description={`Your search for "${query}" didn't match any ${searchType === 'all' ? 'content' : searchType}. Try searching with different keywords.`}
        />
      )}

      {hasResults && searchType !== 'all' && !isDetailMode && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {searchType === 'songs'
            ? results.map((track) => <TrackCard key={track.id} track={track} onSelectTrack={onSelectTrack} />)
            : results.map((item) => <CollectionCard key={item.id} item={item} onOpenDetail={onOpenDetail} />)}
        </div>
      )}

      {hasResults && searchType === 'all' && !isDetailMode && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {allMixedResults.map(({ kind, item }, index) =>
            kind === 'song' ? (
              <TrackCard key={`song-${item.id}-${index}`} track={item} onSelectTrack={onSelectTrack} />
            ) : (
              <CollectionCard key={`${item.type || 'collection'}-${item.id}-${index}`} item={item} onOpenDetail={onOpenDetail} />
            )
          )}
        </div>
      )}

      {isDetailMode && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="type-title text-white">{detailPanel?.type ? `${detailPanel.type} details` : 'Details'}</h3>
            <button
              type="button"
              onClick={onBackToResults}
              className="px-3 py-1.5 rounded-lg panel-card text-sm text-gray-200"
            >
              Back to Results
            </button>
          </div>

          {isDetailLoading && (
            <LoadingState message="Loading details..." />
          )}

          {detailError && (
            <ErrorState
              title="Failed to Load Details"
              message={detailError}
            />
          )}

          {detailPanel && !isDetailLoading && !detailError && (
            <div className="space-y-8">
              <div className="panel-card p-5 md:p-6">
                {(() => {
                  const isCollectionType = detailPanel.type === 'playlist' || detailPanel.type === 'album';
                  const isCollectionLiked = isCollectionType
                    ? likedCollections.some(
                        (collection) => collection.id === detailPanel.id && collection.type === detailPanel.type
                      )
                    : false;

                  return (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h4 className="type-display text-white">{sanitizeDisplayText(detailPanel.title)}</h4>
                    {(detailPanel.type === 'playlist' || detailPanel.type === 'album') && (
                      <span className="type-caption text-gray-300">
                        {formatPlaylistDuration(detailPanel.songs)}
                      </span>
                    )}
                  </div>

                  {isCollectionType && (
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onToggleLikeCollection({
                            id: detailPanel.id,
                            type: detailPanel.type,
                            title: detailPanel.title,
                            subtitle: detailPanel.subtitle,
                            image: detailPanel.image
                          })
                        }
                        aria-label={isCollectionLiked ? 'Remove from liked collections' : 'Add to liked collections'}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full panel-card motion-base text-white"
                      >
                        <Heart className={`w-4 h-4 motion-base ${isCollectionLiked ? 'text-blue-300 fill-blue-300' : 'text-gray-100'}`} />
                        Like
                      </button>

                      {detailPanel.songs?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => onPlayCollection(detailPanel, 0)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full panel-card-elevated motion-base text-white"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          Play
                        </button>
                      )}
                    </div>
                  )}
                </div>
                  );
                })()}
                <p className="type-body text-gray-300 mt-2">
                  {sanitizeDisplayText(detailPanel.subtitle || detailPanel.type)}
                </p>
                {detailPanel?.meta?.followerCount ? (
                  <p className="type-body text-gray-400 mt-2">Followers: {detailPanel.meta.followerCount}</p>
                ) : null}
              </div>

              {detailPanel.songs?.length > 0 && (
                <div>
                  <p className="type-caption text-gray-300 mb-3">Songs</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                    {detailPanel.songs.map((track) => (
                      <TrackCard
                        key={`${detailPanel.title}-${track.id}`}
                        track={track}
                        onSelectTrack={() => {
                          if (detailPanel.type === 'playlist' || detailPanel.type === 'album') {
                            const selectedIndex = detailPanel.songs.findIndex((song) => song.id === track.id);
                            onPlayCollection(detailPanel, selectedIndex >= 0 ? selectedIndex : 0);
                            return;
                          }

                          onSelectTrack(track);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {detailPanel.albums?.length > 0 && (
                <div>
                  <p className="type-caption text-gray-300 mb-3">Albums</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                    {detailPanel.albums.map((item) => (
                      <CollectionCard
                        key={`${detailPanel.title}-${item.id}`}
                        item={{ ...item, type: 'album' }}
                        onOpenDetail={onOpenDetail}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!query && !isSearching && !isDetailMode && (
        <div className="space-y-10">
          <div>
            <p className="type-caption text-gray-400 mb-4">Quick Search</p>
            <div className="flex flex-wrap gap-3">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onQuickSuggestion(suggestion)}
                  className="px-4 py-2 panel-card hover:panel-card-elevated motion-base text-white rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#050505]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSection;
