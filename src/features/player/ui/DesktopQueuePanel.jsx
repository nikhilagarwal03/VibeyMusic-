import React, { useMemo } from 'react';
import { ListMusic, Shuffle, Repeat, Repeat1, X } from 'lucide-react';
import { usePlayerStore } from '../../../store/usePlayerStore';
import { sanitizeDisplayText } from '../../../lib/api';
import { Button } from '../../../shared/ui';

const RepeatIcon = ({ repeatMode }) => {
  if (repeatMode === 'one') {
    return <Repeat1 className="w-4 h-4" />;
  }

  return <Repeat className="w-4 h-4" />;
};

const DesktopQueuePanel = () => {
  const playbackQueue = usePlayerStore((state) => state.playbackQueue);
  const currentQueueIndex = usePlayerStore((state) => state.currentQueueIndex);
  const queueSourceTitle = usePlayerStore((state) => state.queueSourceTitle);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const shuffleEnabled = usePlayerStore((state) => state.shuffleEnabled);
  const playTrackFromQueue = usePlayerStore((state) => state.playTrackFromQueue);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const toggleRepeatMode = usePlayerStore((state) => state.toggleRepeatMode);

  const hasQueue = playbackQueue.length > 0;

  const repeatLabel = useMemo(() => {
    if (repeatMode === 'one') return 'Repeat one';
    if (repeatMode === 'all') return 'Repeat all';
    return 'Repeat off';
  }, [repeatMode]);

  if (!hasQueue) {
    return null;
  }

  return (
    <aside className="hidden lg:flex w-[320px] min-w-[320px] h-full border-l border-white/5 bg-black/20 backdrop-blur-xl p-4 flex-col">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="inline-flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-gray-300" />
          <p className="type-title text-white">Queue</p>
        </div>
        <p className="type-caption text-gray-400">{playbackQueue.length} tracks</p>
      </div>

      <p className="type-caption text-gray-300 line-clamp-1 mb-3">
        {sanitizeDisplayText(queueSourceTitle || 'Now playing queue')}
      </p>

      <div className="inline-flex items-center gap-2 mb-4">
        <Button
          variant={shuffleEnabled ? 'elevated' : 'panel'}
          size="sm"
          onClick={toggleShuffle}
          className="inline-flex items-center gap-2"
        >
          <Shuffle className="w-4 h-4" />
          Shuffle
        </Button>

        <Button
          variant={repeatMode === 'off' ? 'panel' : 'elevated'}
          size="sm"
          onClick={toggleRepeatMode}
          className="inline-flex items-center gap-2"
        >
          <RepeatIcon repeatMode={repeatMode} />
          {repeatLabel}
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
        {playbackQueue.map((track, index) => {
          const isActive = index === currentQueueIndex;

          return (
            <button
              key={`${track.id}-${index}`}
              type="button"
              onClick={() => playTrackFromQueue(index)}
              className={`w-full text-left rounded-lg border px-3 py-2 motion-base ${
                isActive
                  ? 'border-blue-400/50 bg-blue-500/20 text-white'
                  : 'border-white/10 bg-white/5 text-gray-200 hover:border-white/20'
              }`}
            >
              <p className="type-body line-clamp-1">{sanitizeDisplayText(track.title || 'Unknown')}</p>
              <p className="type-caption text-gray-400 line-clamp-1 mt-1">{sanitizeDisplayText(track.artist || 'Unknown Artist')}</p>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default DesktopQueuePanel;
