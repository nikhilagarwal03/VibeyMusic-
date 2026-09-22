import React from 'react';
import { Compass, Heart, Play, Search, Sparkles } from 'lucide-react';
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

  const resultCount = searchType === 'all'
    ? allMixedResults.length
    : results.length;

  const searchDescription = hasResults
    ? `${resultCount} ${resultCount === 1 ? 'result' : 'results'} for “${query}”`
    : 'Search songs, artists, albums, and playlists from one focused space.';

  return (
    <div className="min-w-0 space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-blue-300/15 bg-gradient-to-br from-blue-500/15 via-slate-900/35 to-transparent p-5 sm:p-7 md:p-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-blue-200/10" />
        <div className="pointer-events-none absolute right-8 top-7 h-28 w-28 rounded-full border border-blue-200/10" />
        <div className="relative max-w-3xl">
          <div className="mb-4 flex items-center gap-2 text-blue-200/75">
            <Compass className="h-4 w-4" />
            <p className="type-caption">Discovery desk</p>
          </div>
          <h2 className="type-display mb-3 max-w-2xl">Find the next track worth keeping.</h2>
          <p className="type-body mb-6 max-w-xl text-slate-300">{searchDescription}</p>
          <form onSubmit={onSearchSubmit} className="relative w-full max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={onInputChange}
              placeholder={`Search songs, artists... (${minimumSearchLength}+ chars)`}
              className="w-full rounded-xl border border-blue-200/20 bg-slate-950/65 py-3.5 pl-12 pr-4 text-white placeholder-gray-500 shadow-inner focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 motion-base"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/10 px-2 py-1 text-[10px] uppercase tracking-widest text-slate-500 sm:block">Ctrl K</span>
          </form>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
        {searchTypeOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSearchTypeChange(option.id)}
            className={`min-w-0 px-3 py-2 text-sm rounded-full font-medium motion-base sm:px-4 ${
              searchType === option.id
                ? 'chip-soft text-white border border-blue-400/40'
                : 'panel-card text-gray-300 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
        </div>
        {hasResults && <p className="type-caption text-slate-500">Showing {resultCount} results</p>}
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
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <h3 className="type-title text-white">{detailPanel?.type ? `${detailPanel.type} details` : 'Details'}</h3>
            <button
              type="button"
              onClick={onBackToResults}
              className="w-full px-3 py-2 rounded-lg panel-card text-sm text-gray-200 sm:w-auto"
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
              <div className="panel-card overflow-hidden p-5 md:p-6">
                {(() => {
                  const isCollectionType = detailPanel.type === 'playlist' || detailPanel.type === 'album';
                  const isCollectionLiked = isCollectionType
                    ? likedCollections.some(
                        (collection) => collection.id === detailPanel.id && collection.type === detailPanel.type
                      )
                    : false;

                  return (
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    {detailPanel.image ? (
                      <img src={detailPanel.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                    ) : <div className="h-16 w-16 shrink-0 rounded-xl bg-blue-400/10" />}
                    <div className="min-w-0">
                    <h4 className="type-display break-words text-white">{sanitizeDisplayText(detailPanel.title)}</h4>
                    {(detailPanel.type === 'playlist' || detailPanel.type === 'album') && (
                      <span className="type-caption text-gray-300">
                        {formatPlaylistDuration(detailPanel.songs)}
                      </span>
                    )}
                    </div>
                  </div>

                  {isCollectionType && (
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
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
                        className="inline-flex flex-1 items-center justify-center gap-2 px-3 py-2 rounded-full panel-card motion-base text-white sm:flex-none"
                      >
                        <Heart className={`w-4 h-4 motion-base ${isCollectionLiked ? 'text-blue-300 fill-blue-300' : 'text-gray-100'}`} />
                        Like
                      </button>

                      {detailPanel.songs?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => onPlayCollection(detailPanel, 0)}
                          className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-full panel-card-elevated motion-base text-white sm:flex-none"
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
        <section className="panel-card max-w-4xl overflow-hidden">
          <div className="border-b border-white/10 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-2 text-blue-200/75">
              <Sparkles className="h-4 w-4" />
              <p className="type-caption">Start with a signal</p>
            </div>
            <p className="mt-2 text-sm text-slate-400">Try one of these paths, then refine the results with the filters above.</p>
          </div>
          <div className="flex flex-wrap gap-2 p-5 sm:p-7">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onQuickSuggestion(suggestion)}
                  className="rounded-full border border-blue-200/15 bg-blue-400/10 px-4 py-2 text-sm font-medium text-blue-50 hover:border-blue-200/35 hover:bg-blue-400/20 motion-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {suggestion}
                </button>
              ))}
            </div>
        </section>
      )}
    </div>
  );
};

export default SearchSection;
