import React from 'react';
import { Download, Heart, LibraryBig, ListMusic, Music, Plus } from 'lucide-react';
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
  const hasLibraryContent = likedSongs.length > 0 || likedCollections.length > 0 || downloadedTracks?.length > 0 || customPlaylists?.length > 0;

  return (
    <div className="min-w-0 space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="type-caption text-blue-200/70 mb-3">Your collection</p>
          <h2 className="type-display mb-3">A home for your rotation.</h2>
          <p className="type-body max-w-xl text-slate-300">Keep favorites, playlists, and offline listening in one calm space.</p>
        </div>
        <Button onClick={onGoSearch} variant="elevated" size="md" className="inline-flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Find music
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Liked songs', value: likedSongs.length, icon: Heart },
          { label: 'Collections', value: likedCollections.length, icon: LibraryBig },
          { label: 'Downloads', value: downloadedTracks?.length || 0, icon: Download },
          { label: 'Playlists', value: customPlaylists?.length || 0, icon: ListMusic }
        ].map(({ label, value, icon }) => (
          <div key={label} className="panel-card p-4 sm:p-5">
            {React.createElement(icon, { className: 'mb-4 h-4 w-4 text-blue-300' })}
            <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {!hasLibraryContent ? (
        <div className="panel-card flex flex-col items-center px-5 py-16 text-center sm:py-20">
          <Music className="mb-5 h-10 w-10 text-blue-300" />
          <h3 className="type-title text-white">Your library is waiting for a first favorite.</h3>
          <p className="type-body mt-2 max-w-md text-slate-400">Heart a song or collection while exploring, then come back here to find it instantly.</p>
          <Button onClick={onGoSearch} variant="elevated" size="lg" className="mt-6">Explore music</Button>
        </div>
      ) : (
        <div className="space-y-10">
          <section className="panel-card overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
              <div>
                <p className="type-caption text-blue-200/70 mb-2">Make a lane</p>
                <h3 className="type-title text-white">Custom playlists</h3>
              </div>
              <form className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row" onSubmit={(event) => { event.preventDefault(); const name = String(newPlaylistName || '').trim(); if (!name) return; onCreateCustomPlaylist(name); setNewPlaylistName(''); }}>
                <input type="text" value={newPlaylistName} onChange={(event) => setNewPlaylistName(event.target.value)} className="settings-input type-body w-full focus:outline-none sm:w-56" placeholder="New playlist name" />
                <Button type="submit" variant="elevated" size="sm" className="inline-flex items-center justify-center gap-2"><Plus className="h-4 w-4" /> Create</Button>
              </form>
            </div>
            <div className="space-y-3 p-5 sm:p-7">
              {customPlaylists?.length ? customPlaylists.map((playlist) => (
                <div key={playlist.id} className="rounded-xl border border-white/10 bg-black/15 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3"><ListMusic className="h-4 w-4 shrink-0 text-blue-300" /><p className="truncate text-sm font-semibold text-white">{playlist.name}</p></div>
                    <div className="flex gap-2"><Button variant="panel" size="sm" onClick={() => { const nextName = window.prompt('Rename playlist', playlist.name); if (nextName) onRenameCustomPlaylist(playlist.id, nextName); }}>Rename</Button><Button variant="ghost" size="sm" onClick={() => onDeleteCustomPlaylist(playlist.id)}>Delete</Button></div>
                  </div>
                  {playlist.tracks?.length ? <div className="mt-3 grid gap-2 md:grid-cols-2">{playlist.tracks.map((track) => <div key={`${playlist.id}-${track.id}`} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2"><button type="button" className="min-w-0 text-left" onClick={() => onSelectTrack(track)}><p className="type-body line-clamp-1 text-white">{track.title}</p><p className="type-caption mt-1 line-clamp-1 text-gray-400">{track.artist}</p></button><Button variant="ghost" size="sm" onClick={() => onRemoveTrackFromPlaylist(playlist.id, track.id)}>Remove</Button></div>)}</div> : <p className="type-caption mt-3 text-gray-400">No tracks yet. Add songs from the player.</p>}
                </div>
              )) : <p className="type-body text-gray-400">No playlists yet.</p>}
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-end justify-between"><div><p className="type-caption text-blue-200/70 mb-2">Available offline</p><h3 className="type-title text-white">Downloads</h3></div><span className="text-xs text-slate-500">{downloadedTracks?.length || 0} tracks</span></div>
            {downloadedTracks?.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">{downloadedTracks.map((track) => <div key={`download-${track.id}`} className="space-y-2"><TrackCard track={track} onSelectTrack={onSelectTrack} /><Button variant="ghost" size="sm" onClick={() => onRemoveDownloadedTrack(track.id)}>Remove download</Button></div>)}</div> : <p className="type-body text-gray-400">Save tracks from the player to keep them available here.</p>}
          </section>

          {likedSongs.length > 0 && <section><div className="mb-5 flex items-end justify-between"><div><p className="type-caption text-blue-200/70 mb-2">Your favorites</p><h3 className="type-title text-white">Liked songs</h3></div><span className="text-xs text-slate-500">{likedSongs.length} tracks</span></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">{likedSongs.map((track) => <TrackCard key={track.id} track={track} onSelectTrack={onSelectTrack} />)}</div></section>}

          {likedCollections.length > 0 && <section><div className="mb-5 flex items-end justify-between"><div><p className="type-caption text-blue-200/70 mb-2">Saved worlds</p><h3 className="type-title text-white">Liked collections</h3></div><span className="text-xs text-slate-500">{likedCollections.length} collections</span></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">{likedCollections.map((collection) => <CollectionCard key={`${collection.type}-${collection.id}`} item={collection} onOpenDetail={onOpenCollection} />)}</div></section>}
        </div>
      )}
    </div>
  );
};

export default LibrarySection;
