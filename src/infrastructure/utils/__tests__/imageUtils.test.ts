import { replaceExtension } from '@infrastructure/utils/imageUtils';

describe('replaceExtension', () => {
  it('should replace a standard extension', () => {
    expect(replaceExtension('photo.heic', '.jpg')).toBe('photo.jpg');
  });

  it('should replace only the last extension when filename has multiple dots', () => {
    expect(replaceExtension('my.vacation.photo.HEIC', '.jpg')).toBe('my.vacation.photo.jpg');
  });

  it('should append extension when filename has no dot', () => {
    expect(replaceExtension('photo', '.jpg')).toBe('photo.jpg');
  });

  it('should return undefined when fileName is undefined', () => {
    expect(replaceExtension(undefined, '.jpg')).toBeUndefined();
  });

  it('should return empty string when fileName is empty', () => {
    expect(replaceExtension('', '.jpg')).toBe('');
  });

  it('should handle uppercase extensions', () => {
    expect(replaceExtension('IMG_0111.HEIC', '.jpg')).toBe('IMG_0111.jpg');
  });

  it('should preserve path segments before the filename', () => {
    expect(replaceExtension('photos/IMG_0111.heic', '.jpg')).toBe('photos/IMG_0111.jpg');
  });
});
