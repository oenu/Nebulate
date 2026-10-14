import type { Preferences } from './types';

export const DEFAULT_PREFERENCES: Preferences = {
  version: 1,
  showVideoButton: true,
  highlightVideo: true,
  preferNewTab: false,
  buttonColor: '#3EBBF3',
  thumbnails: true,
};

export function migratePreferences(value: unknown, legacy?: unknown): Preferences {
  const current = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const old = legacy && typeof legacy === 'object' ? (legacy as Record<string, unknown>) : {};
  const legacyValue = (key: string): unknown => {
    const option = old[key];
    return option && typeof option === 'object' && 'value' in option ? option.value : undefined;
  };
  const boolean = (key: keyof Preferences, oldKey: string): boolean => {
    const candidate = current[key] ?? legacyValue(oldKey);
    return typeof candidate === 'boolean' ? candidate : Boolean(DEFAULT_PREFERENCES[key]);
  };
  const color = current.buttonColor ?? legacyValue('buttonColor');
  return {
    version: 1,
    showVideoButton: boolean('showVideoButton', 'addVideoButton'),
    highlightVideo: boolean('highlightVideo', 'highlightVideo'),
    preferNewTab: boolean('preferNewTab', 'preferNewTab'),
    thumbnails: boolean('thumbnails', 'homePageThumbnails'),
    buttonColor:
      typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)
        ? color
        : DEFAULT_PREFERENCES.buttonColor,
  };
}
