import React, { useMemo, useState } from 'react';
import { Image, ListMusic, PanelTop, SlidersHorizontal, Volume2, Clock3 } from 'lucide-react';

const SettingsSection = ({ settings }) => {
  const {
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
  } = settings;

  const quickSearchCount = Math.max(1, Math.min(12, Number(quickSearchLimit) || 1));
  const [quickSearchDrafts, setQuickSearchDrafts] = useState({});

  const quickSearchCountOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => index + 1);
  }, []);

  const normalizeQuickSearchInput = (values) => {
    const unique = [];
    const parts = Array.isArray(values)
      ? values.map((item) => item.trim()).filter(Boolean)
      : [];

    parts.forEach((item) => {
      if (!unique.includes(item)) {
        unique.push(item);
      }
    });

    return unique.slice(0, 12);
  };

  const persistQuickSearchSuggestions = (values) => {
    const nextSuggestions = normalizeQuickSearchInput(values);
    if (nextSuggestions.length > 0) {
      setQuickSearchSuggestions(nextSuggestions);
    }
  };

  const quickSearchInputs = Array.from({ length: quickSearchCount }, (_, index) => {
    const draftValue = quickSearchDrafts[index];
    if (typeof draftValue === 'string') {
      return draftValue;
    }

    return quickSearchSuggestions[index] || '';
  });

  const handleQuickSearchCountChange = (value) => {
    const nextCount = Number(value);
    setQuickSearchLimit(nextCount);

    const nextInputs = Array.from({ length: nextCount }, (_, index) => {
      const draftValue = quickSearchDrafts[index];
      if (typeof draftValue === 'string') {
        return draftValue;
      }

      return quickSearchSuggestions[index] || '';
    });

    persistQuickSearchSuggestions(nextInputs);
  };

  const handleQuickSearchInputChange = (index, value) => {
    setQuickSearchDrafts((previous) => ({ ...previous, [index]: value }));
  };

  const settingFields = [
    {
      id: 'default-start-view',
      title: 'Default Start View',
      description: 'Choose which section opens when the app starts.',
      value: defaultStartView,
      onChange: setDefaultStartView,
      options: [
        { value: 'home', label: 'Home' },
        { value: 'search', label: 'Search' },
        { value: 'library', label: 'Library' },
        { value: 'settings', label: 'Settings' }
      ]
    },
    {
      id: 'song-quality',
      title: 'Song Quality',
      description: 'Choose preferred streaming quality.',
      value: audioQuality,
      onChange: setAudioQuality,
      options: [
        { value: '320kbps', label: '320 kbps (High)' },
        { value: '160kbps', label: '160 kbps (Balanced)' },
        { value: '96kbps', label: '96 kbps (Data Saver)' },
        { value: '48kbps', label: '48 kbps (Low)' }
      ]
    },
    {
      id: 'cover-image-quality',
      title: 'Cover Image Quality',
      description: 'Choose preferred album art quality.',
      value: imageQuality,
      onChange: setImageQuality,
      options: [
        { value: '500x500', label: '500x500 (High)' },
        { value: '150x150', label: '150x150 (Balanced)' },
        { value: '50x50', label: '50x50 (Data Saver)' }
      ]
    },
    {
      id: 'player-background-mode',
      title: 'Player Background Style',
      description: 'Choose whether the full player uses dominant color or cover image with dominant tint.',
      value: playerBackgroundMode,
      onChange: setPlayerBackgroundMode,
      options: [
        { value: 'dominant-only', label: 'Dominant Color Only' },
        { value: 'cover-and-dominant', label: 'Cover Image + Dominant Tint' }
      ]
    },
    {
      id: 'home-recent-section',
      title: 'Home Recent Section',
      description: 'Choose what appears in the Home recent section.',
      value: homeRecentSectionMode,
      onChange: setHomeRecentSectionMode,
      options: [
        { value: 'recently-played', label: 'Recently Played' },
        { value: 'recently-liked', label: 'Recently Liked' }
      ]
    },
    {
      id: 'playlist-open-mode',
      title: 'Playlist Opens In Player',
      description: 'Choose whether playlist playback opens the full player screen automatically.',
      value: playlistOpenMode,
      onChange: setPlaylistOpenMode,
      options: [
        { value: 'open-player', label: 'Yes, open player screen' },
        { value: 'stay-in-view', label: 'No, stay on current view' }
      ]
    }
  ];

  const fieldIcons = [SlidersHorizontal, Volume2, Image, PanelTop, Clock3, ListMusic];

  return (
    <div className="min-w-0 space-y-8">
          <header className="max-w-3xl">
            <p className="type-caption text-blue-200/70 mb-3">Control room</p>
            <h2 className="type-display mb-3">Tune VibeyMusic to you.</h2>
            <p className="type-body text-slate-300">Shape playback, artwork, and the way your listening room starts each time.</p>
          </header>

          <section className="w-full max-w-4xl panel-card overflow-hidden bg-gradient-to-br from-blue-500/15 via-slate-900/40 to-transparent">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
              <img src="/Young%20Man%20with%20Tousled%20Hair.jpg" alt="VibeyMusic Avatar" className="h-16 w-16 rounded-2xl border border-blue-300/35 object-cover shadow-lg shadow-blue-950/50" />
              <div className="min-w-0 flex-1">
                <p className="type-caption text-blue-200/70 mb-2">Built for the long listen</p>
                <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">VibeyMusic</h3>
                <p className="mt-1 text-sm text-slate-300">Play, relax, and stay in the right frequency.</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-blue-200">
                  <a href="https://x.com/nikhillhere" target="_blank" rel="noopener noreferrer" className="rounded-full border border-blue-300/20 px-3 py-1.5 hover:bg-blue-300/10">X / Twitter</a>
                  <a href="https://github.com/nikhilagarwal03" target="_blank" rel="noopener noreferrer" className="rounded-full border border-blue-300/20 px-3 py-1.5 hover:bg-blue-300/10">GitHub</a>
                </div>
              </div>
            </div>
          </section>

          <div className="grid max-w-6xl gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)]">
            <section className="panel-card overflow-hidden">
              <div className="border-b border-white/10 px-5 py-5 sm:px-7">
                <p className="type-caption text-blue-200/70 mb-2">Playback profile</p>
                <h3 className="type-title text-white">Core preferences</h3>
              </div>
              <div className="divide-y divide-white/10">
                {settingFields.map((field, index) => {
                  const Icon = fieldIcons[index];
                  return (
                    <div key={field.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                      <div className="flex min-w-0 gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-blue-200">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <label htmlFor={field.id} className="block text-sm font-semibold text-white">{field.title}</label>
                          <p className="mt-1 max-w-xl text-sm leading-5 text-slate-400">{field.description}</p>
                        </div>
                      </div>
                      <div className="settings-select-wrap w-full shrink-0 sm:w-56">
                        <select id={field.id} value={field.value} onChange={(e) => field.onChange(e.target.value)} className="w-full settings-select type-body focus:outline-none">
                          {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="panel-card h-fit overflow-hidden">
              <div className="border-b border-white/10 px-5 py-5">
                <p className="type-caption text-blue-200/70 mb-2">Home surface</p>
                <h3 className="type-title text-white">Quick searches</h3>
                <p className="mt-2 text-sm leading-5 text-slate-400">Choose the shortcuts that appear on Home.</p>
              </div>
              <div className="space-y-5 p-5">
                <div>
                  <label htmlFor="home-quick-search-count" className="mb-2 block text-sm font-semibold text-white">Visible shortcuts</label>
                  <div className="settings-select-wrap w-full">
                    <select id="home-quick-search-count" value={quickSearchCount} onChange={(e) => handleQuickSearchCountChange(e.target.value)} className="w-full settings-select type-body focus:outline-none">
                      {quickSearchCountOptions.map((count) => <option key={count} value={count}>{count} shortcuts</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {quickSearchInputs.map((value, index) => (
                    <input key={`quick-search-input-${index + 1}`} id={`quick-search-input-${index + 1}`} type="text" value={value} onChange={(e) => handleQuickSearchInputChange(index, e.target.value)} onBlur={() => persistQuickSearchSuggestions(quickSearchInputs)} className="w-full settings-input type-body focus:outline-none" placeholder={`Quick search ${index + 1}`} />
                  ))}
                </div>
                <p className="type-caption text-gray-400">Changes save when you leave an input field.</p>
              </div>
            </section>
          </div>
        </div>
  );
};

export default SettingsSection;
