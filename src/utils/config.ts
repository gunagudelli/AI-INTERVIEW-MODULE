// Global configuration utility
export const getBaseUrl = (): string => {
  // Check if config is set via ConfigPage
  if ((window as any).ASKOXY_BASE_URL) {
    return (window as any).ASKOXY_BASE_URL;
  }
  
  // Try to get from localStorage
  const savedConfig = localStorage.getItem('askoxy-config');
  if (savedConfig) {
    const config = JSON.parse(savedConfig);
    return config.currentBaseUrl;
  }
  
  // Default to local
  return 'http://localhost:3001';
};

// API utility function with dynamic base URL
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  console.log(`🌐 API Call: ${url}`);
  
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
};

export default { getBaseUrl, apiCall };