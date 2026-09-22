import React from 'react';
import { Activity, Dumbbell, Flame, Guitar, Moon, PartyPopper } from 'lucide-react';
import { Button, CollectionCard, SectionHeader, TrackCard } from '../../../shared/ui';

const vibeButtons = [
  { label: 'Chill', detail: 'Slow burn', search: 'Bollywood chill songs', icon: Guitar },
  { label: 'Trending', detail: 'Right now', search: 'Indian trending now', icon: Flame },
  { label: 'Sad Bops', detail: 'Feel it all', search: 'Indian sad songs', icon: Activity },
  { label: 'Party', detail: 'Turn it up', search: 'indian party music', icon: PartyPopper },
  { label: 'Sleep', detail: 'Soft landing', search: 'sleep music', icon: Moon },
  { label: 'Workout', detail: 'Keep moving', search: 'workout', icon: Dumbbell }
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
  <div className="space-y-12">
    <div className="relative overflow-hidden rounded-2xl border border-blue-300/15 bg-gradient-to-br from-blue-500/15 via-slate-900/20 to-transparent px-6 py-7 md:px-9 md:py-10">
      <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border border-blue-300/10" />
      <div className="absolute -right-2 -top-8 h-32 w-32 rounded-full border border-blue-300/10" />
      <p className="type-caption text-blue-200/80 mb-3">Your listening room</p>
      <h2 className="type-display max-w-xl mb-3">Find the sound that fits the moment.</h2>
      <p className="type-body max-w-lg text-slate-300">Jump back into your rotation or tune the room to a new frequency.</p>

      <div className="mt-7">
        <p className="type-caption text-gray-400 mb-3">Quick Search</p>
        <div className="flex flex-wrap gap-2">
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

    </div>

    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="type-caption text-blue-200/70 mb-2">Curated by mood</p>
          <h3 className="type-title">Explore Vibes</h3>
        </div>
        <span className="hidden text-xs text-gray-500 sm:block">Pick a lane</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {vibeButtons.map((vibe) => {
          const Icon = vibe.icon;
          return (
            <button
              key={vibe.label}
              onClick={() => onQuickSearch(vibe.search)}
              className="group panel-card flex min-h-24 flex-col items-start justify-between p-4 text-left"
            >
              <Icon className="h-5 w-5 text-blue-300 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110" />
              <span>
                <span className="block text-sm font-semibold text-white">{vibe.label}</span>
                <span className="text-xs text-slate-400">{vibe.detail}</span>
              </span>
            </button>
          );
        })}
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
