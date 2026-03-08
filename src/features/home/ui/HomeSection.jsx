import React from 'react';
import { Button, CollectionCard, SectionHeader, TrackCard } from '../../../shared/ui';

const vibeButtons = [
  { label: '🎸 Chill', search: 'Bollywood chill songs' },
  { label: '🔥 Trending', search: 'Indian trending now' },
  { label: '💔 Sad Bops', search: 'Indian sad songs' },
  { label: '🎉 Party', search: 'indian party music' },
  { label: '😴 Sleep', search: 'sleep music' },
  { label: '💪 Workout', search: 'workout' }
];

const HomeSection = ({ home, onSelectTrack }) => {
  const {
    quickSuggestions,
    quickSearchLimit,
    onQuickSearch,
    likedSongs,
    recentlyPlayedSongs,
    homeRecentSectionMode,
    onClearRecentlyPlayed,
    onOpenRecentCollection
  } = home;
  const visibleQuickSuggestions = quickSuggestions.slice(0, quickSearchLimit);
  const isRecentlyLikedMode = homeRecentSectionMode === 'recently-liked';
  const recentItems = (isRecentlyLikedMode ? likedSongs : recentlyPlayedSongs).slice(0, 8);
  const recentSectionTitle = isRecentlyLikedMode ? 'Recently Liked' : 'Recently Played';
  const recentSectionEmptyText = isRecentlyLikedMode
    ? 'Like songs to see them here.'
    : 'Play songs to see them here.';
  const canClearRecentlyPlayed = !isRecentlyLikedMode && recentItems.length > 0;

  return (
  <div className="space-y-10">
    <div>
      <h2 className="type-display mb-7">Welcome Back</h2>

      <div>
        <p className="type-caption text-gray-400 mb-4">Quick Search</p>
        <div className="flex flex-wrap gap-3">
          {visibleQuickSuggestions.map((suggestion) => (
            <Button
              key={suggestion}
              onClick={() => onQuickSearch(suggestion)}
              variant="panel"
              size="md"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <p className="type-caption text-gray-400 mb-4">Explore Vibes</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {vibeButtons.map((vibe) => (
            <Button
              key={vibe.label}
              onClick={() => onQuickSearch(vibe.search)}
              variant="panel"
              size="md"
              className="p-4 text-left"
            >
              {vibe.label}
            </Button>
          ))}
        </div>
      </div>
    </div>

    <div>
      <SectionHeader
        title={recentSectionTitle}
        action={canClearRecentlyPlayed ? (
          <Button
            size="sm"
            variant="panel"
            onClick={onClearRecentlyPlayed}
            className="text-gray-200"
          >
            Clear Recently Played
          </Button>
        ) : null}
      />
      {recentItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6">
          {recentItems.map((item) => {
            const itemType = item?.entityType || 'song';

            if (itemType === 'song' || isRecentlyLikedMode) {
              const track = item?.trackData || item;
              return <TrackCard key={`song-${item.id}`} track={track} onSelectTrack={onSelectTrack} />;
            }

            return (
              <CollectionCard
                key={`${itemType}-${item.id}`}
                item={{
                  id: item.id,
                  type: itemType,
                  title: item.title,
                  subtitle: item.subtitle,
                  image: item.image
                }}
                onOpenDetail={onOpenRecentCollection}
              />
            );
          })}
        </div>
      ) : (
        <p className="type-body text-gray-400">{recentSectionEmptyText}</p>
      )}
    </div>
  </div>
  );
};

export default HomeSection;
