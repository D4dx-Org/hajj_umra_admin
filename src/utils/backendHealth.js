// Backend health check utility
export const waitForBackend = async (maxRetries = 10, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL_V2}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        console.log('Backend is ready!');
        return true;
      }
    } catch (error) {
      console.log(`Backend not ready (attempt ${i + 1}/${maxRetries}):`, error.message);
    }
    
    // Exponential backoff
    const delay = baseDelay * Math.pow(1.5, i);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  console.warn('Backend health check failed after maximum retries');
  return false;
};

// Enhanced fetch with automatic retry
export const fetchWithRetry = async (url, options = {}, maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      console.log(`Fetch attempt ${i + 1} failed:`, error.message);
      
      // Don't retry on non-network errors
      if (!error.message.includes('fetch') && error.name !== 'TypeError') {
        throw error;
      }
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};