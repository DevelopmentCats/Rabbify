import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/spotify',
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

const spotifyApi = {
  search: async (query) => {
    const response = await apiClient.get('', { params: { action: 'search', q: query } });
    return response.data;
  },
  play: async (trackUri) => {
    await apiClient.post('', { action: 'play', trackUri });
  },
  pause: async () => {
    await apiClient.post('', { action: 'pause' });
  },
  skipToNext: async () => {
    await apiClient.post('', { action: 'skipToNext' });
  },
  skipToPrevious: async () => {
    await apiClient.post('', { action: 'skipToPrevious' });
  },
  getCurrentPlayback: async () => {
    const response = await apiClient.get('', { params: { action: 'getCurrentPlayback' } });
    return response.data;
  },
  getRecommendations: async (seedTracks) => {
    const response = await apiClient.get('', { params: { action: 'getRecommendations', seed_tracks: seedTracks } });
    return response.data;
  },
  setVolume: async (volume) => {
    await apiClient.put('', { action: 'setVolume', volume });
  },
  setRepeatMode: async (mode) => {
    await apiClient.put('', { action: 'setRepeatMode', mode });
  },
  setShuffle: async (state) => {
    await apiClient.put('', { action: 'setShuffle', state });
  },
  setAccessToken: (token) => {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
};

export default spotifyApi;