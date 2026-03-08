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
