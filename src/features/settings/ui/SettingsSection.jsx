import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
      description: 'Choose whether the full player uses only dominant color or cover image with dominant tint.',
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

  return (
    <div>
      {/* About the Developer Section */}
      <div className="max-w-2xl panel-card p-4 sm:p-6 md:p-7 mb-8 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-blue-900/80 via-gray-900/90 to-gray-800/80 border border-blue-500/20 shadow-xl rounded-xl">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img
            src="/Young%20Man%20with%20Tousled%20Hair.jpg"
            alt="VibeyMusic Avatar"
            className="w-16 h-16 rounded-full border-2 border-blue-400 shadow-md object-cover ring-2 ring-blue-500/20"
          />
        </div>
        {/* Info */}
        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-bold text-blue-200 mb-1 tracking-tight font-sans">VibeyMusic <span className="align-middle">🎶</span></h3>
          <p className="text-xs sm:text-sm font-semibold text-blue-300 mb-1 font-sans">By Nikhil Agarwal</p>
          <p className="text-base sm:text-base font-medium text-blue-100 mb-2 font-sans italic">Play, relax, and vibe on!</p>
          <div className="flex gap-3 mt-1">
            <a href="https://x.com/nikhillhere" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-300 hover:text-blue-200 font-semibold transition-colors text-sm sm:text-base">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M22.162 5.656c-.793.352-1.645.59-2.54.698a4.48 4.48 0 0 0 1.963-2.475 8.93 8.93 0 0 1-2.828 1.082A4.466 4.466 0 0 0 11.07 9.03c0 .35.04.69.115 1.016-3.71-.186-7-1.963-9.197-4.663a4.48 4.48 0 0 0-.604 2.247c0 1.55.79 2.92 2.002 3.724a4.44 4.44 0 0 1-2.022-.56v.057c0 2.166 1.54 3.97 3.584 4.38-.375.102-.77.157-1.178.157-.288 0-.563-.027-.834-.08.564 1.76 2.2 3.04 4.14 3.07A8.97 8.97 0 0 1 2 19.54a12.67 12.67 0 0 0 6.86 2.01c8.23 0 12.74-6.82 12.74-12.74 0-.19-.01-.38-.02-.57a9.1 9.1 0 0 0 2.24-2.32z"/></svg>
              <span>X (Twitter)</span>
            </a>
            <a href="https://github.com/nikhilagarwal03" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-100 hover:text-white font-semibold transition-colors text-sm sm:text-base">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.687-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.594 1.028 2.687 0 3.847-2.337 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.577.688.48C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"/></svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
      <h2 className="type-display mb-7">Settings</h2>

      <div className="max-w-2xl panel-card p-4 sm:p-5 md:p-6 space-y-5 sm:space-y-6">
        {settingFields.map((field, index) => (
          <div
            key={field.id}
            className={index < settingFields.length - 1 ? 'pb-5 border-b border-white/5' : ''}
          >
            <label htmlFor={field.id} className="type-title text-white mb-2 block">
              {field.title}
            </label>
            <p className="type-body text-gray-300 mb-3">{field.description}</p>

            <div className="settings-select-wrap w-full md:w-[320px]">
              <select
                id={field.id}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full settings-select type-body focus:outline-none"
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="settings-select-icon" aria-hidden="true" />
            </div>
          </div>
        ))}

        <div className="pt-5 border-t border-white/5">
          <label htmlFor="home-quick-search-count" className="type-title text-white mb-2 block">
            Home Quick Search Count
          </label>
          <p className="type-body text-gray-300 mb-3">Choose how many quick searches appear on the Home page.</p>

          <div className="settings-select-wrap w-full md:w-[320px]">
            <select
              id="home-quick-search-count"
              value={quickSearchCount}
              onChange={(e) => handleQuickSearchCountChange(e.target.value)}
              className="w-full settings-select type-body focus:outline-none"
            >
              {quickSearchCountOptions.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
            <ChevronDown className="settings-select-icon" aria-hidden="true" />
          </div>

          <div className="mt-5">
            <p className="type-title text-white mb-2">Home Quick Search Options</p>
            <p className="type-body text-gray-300 mb-3">
              You selected {quickSearchCount}. Enter one quick search in each field.
            </p>

            <div className="space-y-2.5">
              {quickSearchInputs.map((value, index) => (
                <input
                  key={`quick-search-input-${index + 1}`}
                  id={`quick-search-input-${index + 1}`}
                  type="text"
                  value={value}
                  onChange={(e) => handleQuickSearchInputChange(index, e.target.value)}
                  onBlur={() => persistQuickSearchSuggestions(quickSearchInputs)}
                  className="w-full settings-input type-body focus:outline-none"
                  placeholder={`Quick search ${index + 1}`}
                />
              ))}
            </div>
            <p className="type-caption text-gray-400 mt-2">Changes save when you leave an input field.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
