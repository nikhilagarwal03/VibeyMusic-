import React from 'react';
import { Download, ListPlus, Play } from 'lucide-react';
import { removeTitlePrefixFromArtist, sanitizeDisplayText } from '../../lib/api';
import vibeyLogo from '../../assets/img1.png';
import { usePlayerStore } from '../../store/usePlayerStore';
import Card from './Card';

const TrackCard = ({ track, onSelectTrack }) => {
  const downloadTrack = usePlayerStore((state) => state.downloadTrack);
  const customPlaylists = usePlayerStore((state) => state.customPlaylists);
  const addTrackToPlaylist = usePlayerStore((state) => state.addTrackToPlaylist);

  const cleanTitle = sanitizeDisplayText(track.title);
  const cleanArtist = removeTitlePrefixFromArtist(cleanTitle, track.artist);

  return (
    <Card
      interactive
      onClick={() => onSelectTrack(track)}
      className="p-4 group relative"
    >
      <div className="w-full aspect-square bg-white/5 rounded-lg mb-4 overflow-hidden relative">
        <img
          src={track.image}
          alt={track.title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = vibeyLogo;
          }}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 motion-base pointer-events-none flex items-center justify-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center motion-base">
            <Play className="w-6 h-6 text-black fill-black ml-1" />
          </div>
        </div>

        <div className="absolute top-2 right-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 motion-base">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              downloadTrack(track);
            }}
            className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 motion-base"
            aria-label="Save to downloads"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (!customPlaylists?.length) return;
              addTrackToPlaylist(customPlaylists[0].id, track);
            }}
            className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 motion-base"
            aria-label="Save to playlist"
          >
            <ListPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h3 className="type-body font-semibold text-white line-clamp-2">{cleanTitle}</h3>
      <p className="type-body text-gray-300 mt-1 line-clamp-2">{cleanArtist}</p>
    </Card>
  );
};

export default TrackCard;
