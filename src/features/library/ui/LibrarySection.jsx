import React from 'react';
import { Music } from 'lucide-react';
import { Button, CollectionCard, TrackCard } from '../../../shared/ui';

const LibrarySection = ({ library, onSelectTrack }) => {
  const {
    likedSongs,
    likedCollections,
    downloadedTracks,
    customPlaylists,
    onGoSearch,
    onOpenCollection,
    onCreateCustomPlaylist,
    onRenameCustomPlaylist,
    onDeleteCustomPlaylist,
    onRemoveTrackFromPlaylist,
    onRemoveDownloadedTrack,
  } = library;
  const [newPlaylistName, setNewPlaylistName] = React.useState('');
  const hasLikedContent = likedSongs.length > 0 || likedCollections.length > 0;

  return (
    <div>
    <h2 className="type-display mb-7">Your Library</h2>

    {!hasLikedContent ? (
      <div className="text-center py-12">
        <Music className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <p className="type-body text-gray-300 mb-2">No liked items yet</p>
        <p className="type-body text-gray-400 mb-6">Heart songs, albums, artists, or playlists to see them here</p>
        <Button
          onClick={onGoSearch}
          variant="elevated"
          size="lg"
        >
          Explore & Like Songs
        </Button>
      </div>
    ) : (
      <div className="space-y-10">
        <div>
          <p className="type-body text-gray-400 mb-4">Custom Playlists</p>
          <form
            className="flex flex-wrap gap-2 mb-4"
            onSubmit={(event) => {
              event.preventDefault();
              const name = String(newPlaylistName || '').trim();
              if (!name) return;
              onCreateCustomPlaylist(name);
              setNewPlaylistName('');
            }}
          >
            <input
              type="text"
              value={newPlaylistName}
              onChange={(event) => setNewPlaylistName(event.target.value)}
              className="settings-input type-body focus:outline-none min-w-[220px]"
              placeholder="New playlist name"
            />
            <Button type="submit" variant="elevated" size="sm">Create Playlist</Button>
          </form>

          {customPlaylists?.length ? (
            <div className="space-y-3">
              {customPlaylists.map((playlist) => (
                <div key={playlist.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="type-body text-white">{playlist.name}</p>
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="panel"
                        size="sm"
                        onClick={() => {
                          const nextName = window.prompt('Rename playlist', playlist.name);
                          if (nextName) {
                            onRenameCustomPlaylist(playlist.id, nextName);
                          }
                        }}
                      >
                        Rename
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDeleteCustomPlaylist(playlist.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>

                  {playlist.tracks?.length ? (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {playlist.tracks.map((track) => (
                        <div key={`${playlist.id}-${track.id}`} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            className="text-left min-w-0"
                            onClick={() => onSelectTrack(track)}
                          >
                            <p className="type-body text-white line-clamp-1">{track.title}</p>
                            <p className="type-caption text-gray-400 line-clamp-1">{track.artist}</p>
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveTrackFromPlaylist(playlist.id, track.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="type-caption text-gray-400 mt-2">No tracks yet. Save songs from the player to add them.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="type-body text-gray-400">No playlists yet.</p>
          )}
        </div>

        <div>
          <p className="type-body text-gray-400 mb-4">Offline Downloads (local library)</p>
          {downloadedTracks?.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6">
              {downloadedTracks.map((track) => (
                <div key={`download-${track.id}`} className="space-y-2">
                  <TrackCard track={track} onSelectTrack={onSelectTrack} />
                  <Button variant="ghost" size="sm" onClick={() => onRemoveDownloadedTrack(track.id)}>
                    Remove Download
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="type-body text-gray-400">No downloaded tracks yet. Save tracks from the player bar.</p>
          )}
        </div>

        {likedSongs.length > 0 && (
          <div>
            <p className="type-body text-gray-400 mb-6">
              {likedSongs.length} liked {likedSongs.length === 1 ? 'song' : 'songs'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6">
              {likedSongs.map((track) => (
                <TrackCard key={track.id} track={track} onSelectTrack={onSelectTrack} />
              ))}
            </div>
          </div>
        )}

        {likedCollections.length > 0 && (
          <div>
            <p className="type-body text-gray-400 mb-6">
              {likedCollections.length} liked {likedCollections.length === 1 ? 'collection' : 'collections'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6">
              {likedCollections.map((collection) => (
                <CollectionCard
                  key={`${collection.type}-${collection.id}`}
                  item={collection}
                  onOpenDetail={onOpenCollection}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )}
    </div>
  );
};

export default LibrarySection;
