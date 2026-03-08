import {
  normalizeRepeatMode,
  normalizeShuffleEnabled,
  normalizeCustomPlaylists,
  normalizeDownloadedTracks,
} from './helpers';

describe('store helper normalizers', () => {
  test('normalizes repeat mode safely', () => {
    expect(normalizeRepeatMode('all')).toBe('all');
    expect(normalizeRepeatMode('one')).toBe('one');
    expect(normalizeRepeatMode('anything-else')).toBe('off');
  });

  test('normalizes shuffle flag', () => {
    expect(normalizeShuffleEnabled(true)).toBe(true);
    expect(normalizeShuffleEnabled(0)).toBe(false);
  });

  test('normalizes downloaded tracks and deduplicates by id', () => {
    const normalized = normalizeDownloadedTracks([
      { id: '1', title: 'Track 1' },
      { id: '1', title: 'Track 1 Duplicate' },
      { id: '2', title: 'Track 2' },
    ]);

    expect(normalized).toHaveLength(2);
    expect(normalized[0].id).toBe('1');
    expect(normalized[1].id).toBe('2');
  });

  test('ensures at least one playlist exists after normalization', () => {
    const normalized = normalizeCustomPlaylists([]);
    expect(normalized.length).toBeGreaterThan(0);
    expect(normalized[0].id).toBeTruthy();
  });
});
