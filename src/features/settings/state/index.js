/**
 * Settings feature state
 * Links to settings slice in Zustand store
 */

import { usePlayerStore } from '../../../store/usePlayerStore';

// Settings state selectors
export const useSettingsState = () => usePlayerStore((state) => ({
  audioQuality: state.audioQuality,
  imageQuality: state.imageQuality,
}));

// Settings actions
export const useSettingsActions = () => usePlayerStore((state) => ({
  setAudioQuality: state.setAudioQuality,
  setImageQuality: state.setImageQuality,
}));

// Convenience re-exports
export { usePlayerStore };
