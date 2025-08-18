import Constants from 'expo-constants';

export const generateAPIUrl = (relativePath: string) => {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  // Handle undefined experienceUrl
  const experienceUrl = Constants.experienceUrl;
  
  if (process.env.NODE_ENV === 'development') {
    if (!experienceUrl) {
      // Fallback for development when experienceUrl is undefined
      // Use localhost with common Expo development port
      return `http://localhost:8081${path}`;
    }
    const origin = experienceUrl.replace('exp://', 'http://');
    return `${origin}${path}`;
  } else {
    // In production, use relative paths (works with deployed apps)
    return path;
  }
};
