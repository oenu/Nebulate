import { expect, test } from 'vitest';
import { isNebulaVideoURL, nebulaVideoURL } from '../../extension/core/urls';

test('redirects accept only canonical first-party video URLs', () => {
  expect(isNebulaVideoURL(nebulaVideoURL('notjustbikes-cycling'))).toBe(true);
  for (const value of [
    'javascript:alert(1)',
    'https://nebula.tv.evil.invalid/videos/test/',
    'https://nebula.tv/videos/test/?next=evil',
    'https://user@nebula.tv/videos/test/',
    'http://nebula.tv/videos/test/',
    'https://nebula.tv/videos/../account/',
    undefined,
  ]) {
    expect(isNebulaVideoURL(value)).toBe(false);
  }
  expect(() => nebulaVideoURL('../account')).toThrow();
});
