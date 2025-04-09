import axios from 'axios';

const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || ''}/api/spotify`,
});

const handleConnectionError = (error) => {
  if (error.message.includes('Could not establish connection') || 
      error.message.includes('Receiving end does not exist')) {
    console.warn('Connection error occurred:', error.message);
    console.warn('Error name:', error.name);
    console.warn('Error stack:', error.stack);
    console.warn('Request URL:', error.config?.url);
    console.warn('Request method:', error.config?.method);
    return { data: null };
  }
  throw error;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message.includes('Could not establish connection') || 
        error.message.includes('Receiving end does not exist')) {
      console.warn('Connection error:', error.message);
      return Promise.resolve({ data: null });
    }
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized access, redirecting to login');
      window.location.href = '/api/auth';
    }
    return Promise.reject(error);
  }
);

const spotifyApi = {
  search: async (query) => {
    try {
      const response = await apiClient.get('', { params: { action: 'search', q: query } });
      return response.data;
    } catch (error) {
      return handleConnectionError(error);
    }
  },
  play: async (data) => {
    try {
      console.log('Attempting to play with data:', data);
      const response = await apiClient.put('', { action: 'play', ...data });
      console.log('Play response:', response);
      return response.data;
    } catch (error) {
      console.error('Error in spotifyApi.play:', error);
      throw error; // Propagate the error to the caller
    }
  },
  pause: async (deviceId) => {
    try {
      const response = await apiClient.put('', { action: 'pause', device_id: deviceId });
      console.log('Pause response:', response);
      return response.data;
    } catch (error) {
      console.error('Error in spotifyApi.pause:', error);
      return handleConnectionError(error);
    }
  },
  skipToNext: async (deviceId) => {
    try {
      const response = await apiClient.post('', { action: 'skipToNext', device_id: deviceId });
      console.log('Skip to next response:', response);
      return response.data;
    } catch (error) {
      console.error('Error in spotifyApi.skipToNext:', error);
      return handleConnectionError(error);
    }
  },
  skipToPrevious: async (deviceId) => {
    try {
      const response = await apiClient.post('', { action: 'skipToPrevious', device_id: deviceId });
      console.log('Skip to previous response:', response);
      return response.data;
    } catch (error) {
      console.error('Error in spotifyApi.skipToPrevious:', error);
      return handleConnectionError(error);
    }
  },
  getCurrentPlayback: async () => {
    try {
      const response = await apiClient.get('', { params: { action: 'getCurrentPlayback' } });
      return response.data;
    } catch (error) {
      return handleConnectionError(error);
    }
  },
  getRecommendations: async (seedTracks) => {
    try {
      const response = await apiClient.get('', { params: { action: 'getRecommendations', seed_tracks: seedTracks } });
      return response.data;
    } catch (error) {
      return handleConnectionError(error);
    }
  },
  setVolume: async (volumePercent, deviceId) => {
    try {
      const response = await apiClient.put('', {
        action: 'setVolume',
        volume_percent: volumePercent,
        device_id: deviceId,
      });
      console.log('Set volume response:', response);
      return response.data;
    } catch (error) {
      console.error('Error in spotifyApi.setVolume:', error);
      return handleConnectionError(error);
    }
  },
  setRepeatMode: async (mode, deviceId) => {
    try {
      const response = await apiClient.put('', { action: 'setRepeatMode', mode, device_id: deviceId });
      console.log('Set repeat mode response:', response);
      return response.data;
    } catch (error) {
      console.error('Error in spotifyApi.setRepeatMode:', error);
      return handleConnectionError(error);
    }
  },
  setShuffle: async (state, deviceId) => {
    try {
      const response = await apiClient.put('', { action: 'setShuffle', state, device_id: deviceId });
      console.log('Set shuffle response:', response);
      return response.data;
    } catch (error) {
      console.error('Error in spotifyApi.setShuffle:', error);
      return handleConnectionError(error);
    }
  },
  transferPlayback: async (deviceId, play = false) => {
    try {
      console.log('Attempting to transfer playback to device:', deviceId);
      const response = await apiClient.put('', { 
        action: 'transferPlayback', 
        device_ids: [deviceId],
        play
      });
      console.log('Transfer playback response:', response);
      return response.data;
    } catch (error) {
      console.error('Error in spotifyApi.transferPlayback:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },
  refreshAccessToken: async () => {
    try {
      const response = await apiClient.post('', { action: 'refreshToken' });
      return response.data;
    } catch (error) {
      return handleConnectionError(error);
    }
  },
  getUserProfile: async () => {
    try {
      const response = await apiClient.get('', { params: { action: 'getUserProfile' } });
      return response.data;
    } catch (error) {
      return handleConnectionError(error);
    }
  },
  getAvailableDevices: async () => {
    try {
      const response = await apiClient.get('', { params: { action: 'getAvailableDevices' } });
      console.log('Available devices response:', response.data);
      return response.data.devices || [];
    } catch (error) {
      console.error('Error fetching available devices:', error);
      return handleConnectionError(error);
    }
  },
  getCurrentPlaybackState: async () => {
    try {
      const response = await apiClient.get('', { params: { action: 'getCurrentPlaybackState' } });
      return response.data;
    } catch (error) {
      return handleConnectionError(error);
    }
  },
  getRecentlyPlayed: async () => {
    try {
      const response = await apiClient.get('', { params: { action: 'getRecentlyPlayed' } });
      return response.data;
    } catch (error) {
      return handleConnectionError(error);
    }
  },
  getTopTracks: async () => {
    try {
      const response = await apiClient.get('', { params: { action: 'getTopTracks' } });
      console.log('Top tracks response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      return handleConnectionError(error);
    }
  },
  getNewReleases: async () => {
    try {
      const response = await apiClient.get('', { params: { action: 'getNewReleases' } });
      return response.data;
    } catch (error) {
      return handleConnectionError(error);
    }
  },
  getAccessToken: async () => {
    try {
      const response = await apiClient.get('', { params: { action: 'getAccessToken' } });
      return response.data;
    } catch (error) {
      return handleConnectionError(error);
    }
  },
  getQueue: async () => {
    try {
      const response = await apiClient.get('', { params: { action: 'getPlaybackQueue' } });
      return response.data.queue || [];
    } catch (error) {
      console.error('Error in spotifyApi.getQueue:', error);
      if (error.response && error.response.status === 524) {
        console.warn('Request timed out. The server might be overloaded or the Spotify API might be slow to respond.');
      }
      return [];
    }
  },
  addToQueue: async (uris) => {
    try {
      const response = await apiClient.post('', { action: 'addToQueue', uris });
      return response.data;
    } catch (error) {
      console.error('Error in spotifyApi.addToQueue:', error);
      throw error;
    }
  },
  registerDevice: async (deviceId, deviceName) => {
    try {
      const response = await apiClient.post('', { 
        action: 'registerDevice', 
        device_id: deviceId, 
        device_name: deviceName 
      });
      return response.data;
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  },
};

export default spotifyApi;