import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import spotifyApi from './spotifyAPI';

const RabbifyPlayerContext = createContext(null);

export const useRabbifyPlayer = () => {
  const [playerState, setPlayerState] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const rabbifyPlayerRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await spotifyApi.getUserProfile();
        setIsAuthenticated(!!response && !!response.id);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !rabbifyPlayerRef.current) {
      rabbifyPlayerRef.current = new RabbifyPlayer();
      rabbifyPlayerRef.current.setStateUpdateCallback(setPlayerState);
    }
  }, [isAuthenticated]);

  const initializePlayer = async () => {
    if (rabbifyPlayerRef.current && !isPlayerReady) {
      try {
        const token = await spotifyApi.getAccessToken();
        if (token) {
          await rabbifyPlayerRef.current.initialize(token);
          setIsPlayerReady(true);
        }
      } catch (error) {
        console.error('Error initializing RabbifyPlayer:', error);
      }
    }
  };

  return {
    rabbifyPlayer: rabbifyPlayerRef.current,
    playerState,
    isAuthenticated,
    isPlayerReady,
    initializePlayer
  };
};

export const RabbifyPlayerProvider = ({ children }) => {
  const [rabbifyPlayer] = useState(() => new RabbifyPlayer());
  const [playerState, setPlayerState] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await spotifyApi.getUserProfile();
        setIsAuthenticated(!!response && !!response.id);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <RabbifyPlayerContext.Provider value={{ rabbifyPlayer, playerState, setPlayerState, isAuthenticated }}>
      {children}
    </RabbifyPlayerContext.Provider>
  );
};

class RabbifyPlayer {
  constructor() {
    this.player = null;
    this.deviceId = null;
    this.isPlayerCreated = false;
    this.activeDevice = null;
    this.isRabbifyPlayerActive = false;
    this.currentTrack = null;
    this.isPaused = true;
    this.playbackPosition = 0;
    this.trackDuration = 0;
    this.repeatMode = 'off';
    this.shuffleMode = false;
    this.volume = 50;
    this.playbackQueue = [];
    this.stateUpdateCallback = null;
    this.pollingInterval = null;
  }

  async initialize(accessToken) {
    try {
      console.log('Loading Spotify SDK');
      await this.loadSpotifySDK();
      console.log('Waiting for Spotify SDK');
      await this.waitForSpotifySDK();
      console.log('Creating Spotify player');
      await this.createPlayer(accessToken);
      console.log('Registering device');
      await this.registerDevice();
      console.log('Starting polling');
      this.startPolling();
      console.log('RabbifyPlayer initialized successfully');
    } catch (error) {
      console.error('Error initializing RabbifyPlayer:', error);
      throw error;
    }
  }

  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.pollingInterval = setInterval(async () => {
      if (this.isRabbifyPlayerActive) {
        await this.updatePlayerState();
      }
    }, 1000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  async updatePlayerState() {
    try {
      const playbackState = await spotifyApi.getCurrentPlaybackState();
      if (playbackState) {
        this.updateStateFromPlayback(playbackState);
      } else {
        this.resetPlayerState();
      }
      this.triggerStateUpdate();
    } catch (error) {
      console.error('Error updating player state:', error);
    }
  }

  updateStateFromPlayback(playbackState) {
    if (playbackState && playbackState.item) {
      this.currentTrack = playbackState.item;
      this.isPaused = !playbackState.is_playing;
      this.playbackPosition = playbackState.progress_ms || 0;
      this.trackDuration = playbackState.item.duration_ms || 0;
      this.activeDevice = playbackState.device.id;
      this.isRabbifyPlayerActive = this.activeDevice === this.player?._options.id;
      this.volume = playbackState.device.volume_percent;
      this.repeatMode = playbackState.repeat_state;
      this.shuffleMode = playbackState.shuffle_state;
    } else {
      console.warn('Received invalid playback state:', playbackState);
    }
  }

  resetPlayerState() {
    this.currentTrack = null;
    this.isPaused = true;
    this.playbackPosition = 0;
    this.trackDuration = 0;
    this.isRabbifyPlayerActive = false;
  }

  triggerStateUpdate() {
    if (this.stateUpdateCallback) {
      this.stateUpdateCallback(this.getPlayerState());
    }
  }

  setStateUpdateCallback(callback) {
    this.stateUpdateCallback = callback;
  }

  async createPlayer(accessToken) {
    this.player = new window.Spotify.Player({
      name: 'Rabbify Web Player',
      getOAuthToken: cb => cb(accessToken)
    });

    this.player.addListener('ready', ({ device_id }) => {
      console.log('Rabbify Web Player is ready');
      this.deviceId = device_id;
      this.isPlayerCreated = true;
    });

    this.player.addListener('not_ready', ({ device_id }) => {
      console.log('Rabbify Web Player has gone offline', device_id);
    });

    this.player.addListener('player_state_changed', state => {
      if (state) {
        this.updatePlayerState(state);
      }
    });

    await this.player.connect();
  }

  async registerDevice() {
    if (this.deviceId) {
      try {
        await spotifyApi.registerDevice(this.deviceId, 'Rabbify Web Player');
        console.log('Rabbify Web Player registered successfully');
        // Fetch available devices to confirm registration
        await this.fetchAvailableDevices();
      } catch (error) {
        console.error('Error registering Rabbify Web Player:', error);
      }
    } else {
      console.error('Device ID not available for registration');
    }
  }

  async connectPlayer() {
    if (!this.isPlayerCreated) {
      console.error('Player not created yet');
      return;
    }

    try {
      const connected = await this.player.connect();
      if (connected) {
        console.log('Rabbify Web Player connected successfully');
        this.isRabbifyPlayerActive = true;
        this.activeDevice = this.deviceId;
      }
    } catch (error) {
      console.error('Error connecting Rabbify Web Player:', error);
    }
  }

  handleDeviceSelection = async (rabbifyDeviceId) => {
    try {
      const devices = await this.fetchAvailableDevices();
      const activeDevice = devices.find(device => device.is_active);

      if (activeDevice) {
        // If there's an active device, sync with it
        this.activeDevice = activeDevice.id;
        this.isRabbifyPlayerActive = activeDevice.id === rabbifyDeviceId;
      } else {
        // If no active device, set Rabbify as active
        this.activeDevice = rabbifyDeviceId;
        this.isRabbifyPlayerActive = true;
        await spotifyApi.transferPlayback([rabbifyDeviceId]);
      }

      // Fetch and update the current playback state
      await this.fetchExternalPlaybackState();
      console.log('Active device set to:', this.activeDevice);
    } catch (error) {
      console.error('Error in handleDeviceSelection:', error);
    }
  }

  updatePlayerState = (state) => {
    if (state && state.track_window) {
      this.currentTrack = state.track_window.current_track;
      this.isPaused = state.paused;
      this.playbackPosition = state.position;
      this.trackDuration = state.duration;
      this.repeatMode = state.repeat_mode;
      this.shuffleMode = state.shuffle;
      this.volume = state.device?.volume_percent || 50;

      console.log('Updated player state:', this.getPlayerState());
    } else {
      console.warn('Received invalid state in updatePlayerState:', state);
    }
  }

  getPlayerState = () => {
    return {
      currentTrack: this.currentTrack,
      isPaused: this.isPaused,
      playbackPosition: this.playbackPosition,
      trackDuration: this.trackDuration,
      volume: this.volume,
      repeatMode: this.repeatMode,
      shuffleMode: this.shuffleMode,
      playbackQueue: this.playbackQueue,
      activeDevice: this.activeDevice,
      isRabbifyPlayerActive: this.isRabbifyPlayerActive
    };
  }

  fetchAvailableDevices = async () => {
    try {
      const response = await spotifyApi.getAvailableDevices();
      console.log('Available devices response:', response);
      if (Array.isArray(response) && response.length > 0) {
        const activeDeviceInResponse = response.find(device => device.is_active);
        if (activeDeviceInResponse) {
          this.activeDevice = activeDeviceInResponse.id;
          this.isRabbifyPlayerActive = activeDeviceInResponse.id === this.player?._options.id;
        } else if (this.player && !this.activeDevice) {
          this.activeDevice = this.player._options.id;
          this.isRabbifyPlayerActive = true;
          await spotifyApi.transferPlayback([this.player._options.id]);
        }
        console.log('Active device updated to:', this.activeDevice);
        return response;
      } else {
        console.log('No available devices found');
        return [];
      }
    } catch (error) {
      console.error('Error fetching available devices:', error);
      return [];
    }
  }

  fetchExternalPlaybackState = async () => {
    try {
      const playbackState = await spotifyApi.getCurrentPlaybackState();
      if (playbackState) {
        this.currentTrack = playbackState.item;
        this.isPaused = !playbackState.is_playing;
        this.playbackPosition = playbackState.progress_ms || 0;
        this.trackDuration = playbackState.item?.duration_ms || 0;
        this.activeDevice = playbackState.device.id;
        this.isRabbifyPlayerActive = this.activeDevice === this.player?._options.id;
        this.volume = playbackState.device.volume_percent;
        this.repeatMode = playbackState.repeat_state;
        this.shuffleMode = playbackState.shuffle_state;
        console.log('Playback state fetched:', this.getPlayerState());
      } else {
        // No active playback, reset state
        this.resetPlayerState();
      }
    } catch (error) {
      console.error('Error fetching external playback state:', error);
      this.resetPlayerState();
    }
  }

  resetPlayerState = () => {
    this.currentTrack = null;
    this.isPaused = true;
    this.playbackPosition = 0;
    this.trackDuration = 0;
    this.isRabbifyPlayerActive = false;
    // Keep the last known values for volume, repeat, and shuffle
  }

  play = async (trackUri) => {
    try {
      await spotifyApi.play({ uris: trackUri ? [trackUri] : undefined, device_id: this.activeDevice });
      await this.updatePlayerState();
    } catch (error) {
      console.error('Error in play:', error);
    }
  }

  pause = async () => {
    try {
      await spotifyApi.pause({ device_id: this.activeDevice });
      await this.updatePlayerState();
    } catch (error) {
      console.error('Error in pause:', error);
    }
  }

  skipNext = async () => {
    try {
      console.log('Attempting to skip to next track using Spotify API');
      await spotifyApi.skipToNext({ device_id: this.activeDevice });
      const playbackState = await spotifyApi.getCurrentPlaybackState();
      if (playbackState) {
        this.currentTrack = playbackState.item;
        this.isPaused = !playbackState.is_playing;
      }
    } catch (error) {
      console.error('Error in skipNext:', error);
    }
  }

  skipPrevious = async () => {
    try {
      console.log('Attempting to skip to previous track using Spotify API');
      await spotifyApi.skipToPrevious({ device_id: this.activeDevice });
      const playbackState = await spotifyApi.getCurrentPlaybackState();
      if (playbackState) {
        this.currentTrack = playbackState.item;
        this.isPaused = !playbackState.is_playing;
      }
    } catch (error) {
      console.error('Error in skipPrevious:', error);
    }
  }

  seek = (position) => {
    if (this.player) {
      this.player.seek(position);
    }
  }

  setVolume = async (newVolume) => {
    if (!this.activeDevice) {
      console.error('No active device available');
      return;
    }
    try {
      console.log('Attempting to set volume using Spotify API');
      const volumePercent = Math.round(newVolume);
      await spotifyApi.setVolume(volumePercent, { device_id: this.activeDevice });
      this.volume = volumePercent;
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }

  setRepeatMode = async () => {
    try {
      const newMode = this.repeatMode === 'off' ? 'track' : this.repeatMode === 'track' ? 'context' : 'off';
      console.log('Attempting to set repeat mode using Spotify API');
      await spotifyApi.setRepeatMode(newMode, { device_id: this.activeDevice });
      this.repeatMode = newMode;
    } catch (error) {
      console.error('Error setting repeat mode:', error);
    }
  }

  setShuffleMode = async () => {
    try {
      const newMode = !this.shuffleMode;
      console.log('Attempting to set shuffle mode using Spotify API');
      await spotifyApi.setShuffle(newMode, { device_id: this.activeDevice });
      this.shuffleMode = newMode;
    } catch (error) {
      console.error('Error setting shuffle mode:', error);
    }
  }

  changeDevice = async (deviceId) => {
    if (deviceId !== this.activeDevice) {
      try {
        console.log('Changing device to:', deviceId);
        await spotifyApi.transferPlayback(deviceId, true);
        this.activeDevice = deviceId;
        this.isRabbifyPlayerActive = deviceId === this.player?._options.id;
        console.log('Device changed successfully. New active device:', deviceId);
        await this.fetchExternalPlaybackState();
      } catch (error) {
        console.error('Error changing device:', error);
      }
    }
  }

  getQueue = async () => {
    try {
      const queue = await spotifyApi.getQueue();
      if (queue && Array.isArray(queue)) {
        this.playbackQueue = queue;
        return queue;
      } else {
        console.error('Unexpected queue format:', queue);
        return [];
      }
    } catch (error) {
      console.error('Error fetching playback queue:', error);
      return [];
    }
  }

  loadSpotifySDK = () => {
    return new Promise((resolve, reject) => {
      if (window.Spotify) {
        resolve();
        return;
      }

      window.onSpotifyWebPlaybackSDKReady = () => {
        resolve();
      };

      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  waitForSpotifySDK = () => {
    return new Promise((resolve) => {
      if (window.Spotify) {
        resolve();
      } else {
        window.onSpotifyWebPlaybackSDKReady = resolve;
      }
    });
  }

  async cleanup() {
    this.stopPolling();
    console.log('Starting RabbifyPlayer cleanup');
    if (this.player) {
      console.log('Disconnecting player...');
      await this.player.disconnect();
    }
    this.player = null;
    this.deviceId = null;
    this.isPlayerCreated = false;
    console.log('RabbifyPlayer cleaned up');
  }
}

export default RabbifyPlayer;