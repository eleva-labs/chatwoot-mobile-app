import Constants from 'expo-constants';

export const generateAPIUrl = (relativePath: string) => {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  // Handle undefined experienceUrl
  const experienceUrl = Constants.experienceUrl;
  if (!experienceUrl) {
    console.warn('Constants.experienceUrl is undefined, using relative path');
    return path;
  }
  
  const origin = experienceUrl.replace('exp://', 'http://');

  if (process.env.NODE_ENV === 'development') {
    // In development, construct the URL with the origin
    return `${origin}${path}`;
  } else {
    // In production, use relative paths
    return path;
  }
};
