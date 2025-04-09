import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider, SliderTrack, SliderRange, SliderThumb } from './ui/slider';
import { Music, Search, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, ChevronDown, Check } from 'lucide-react';
import spotifyApi from '../lib/spotifyAPI';
import * as Select from '@radix-ui/react-select';
import {useRabbifyPlayer} from '../lib/rabbifyPlayer';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="mb-2">{this.state.error && this.state.error.toString()}</p>
          <details className="whitespace-pre-wrap">
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

const RabbifyInterface = () => {
  const { rabbifyPlayer, playerState, isAuthenticated, isPlayerReady, initializePlayer } = useRabbifyPlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [newReleases, setNewReleases] = useState([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login') === 'success';
    if (loginSuccess) {
      checkAuth();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
      fetchRecentlyPlayed();
      fetchTopTracks();
      fetchNewReleases();
      fetchAvailableDevices();
      initializePlayer();
    }
  }, [isAuthenticated]);

  const onPlayerStateChanged = (newState) => {
    setPlayerState(newState);
    console.log('Player state changed:', newState);
  };

  const checkAuth = async () => {
    try {
      const response = await spotifyApi.getUserProfile();
      if (response && response.id) {
        setUserProfile(response);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const profile = await spotifyApi.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchAvailableDevices = async () => {
    try {
      const devices = await spotifyApi.getAvailableDevices();
      console.log('Fetched available devices:', devices);
      setAvailableDevices(devices);
    } catch (error) {
      console.error('Error fetching available devices:', error);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const results = await spotifyApi.search(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = async (trackUri) => {
    await rabbifyPlayer.play(trackUri);
  };

  const handlePause = async () => {
    await rabbifyPlayer.pause();
  };

  const handleSkipNext = async () => {
    await rabbifyPlayer.skipNext();
  };

  const handleSkipPrevious = async () => {
    await rabbifyPlayer.skipPrevious();
  };

  const handleSeek = (position) => {
    rabbifyPlayer.seek(position);
  };

  const handleVolumeChange = async (newVolume) => {
    await rabbifyPlayer.setVolume(newVolume);
  };

  const handleRepeatModeChange = async () => {
    await rabbifyPlayer.setRepeatMode();
  };

  const handleShuffleModeChange = async () => {
    await rabbifyPlayer.setShuffleMode();
  };

  const handleLogin = () => {
    window.location.href = '/api/auth';
  };

  const handleLogout = () => {
    window.location.href = '/api/auth?action=logout';
  };

  const handleDeviceChange = async (deviceId) => {
    let retries = 2;
    while (retries > 0) {
      try {
        console.log(`Attempting to change device to: ${deviceId}`);
        await rabbifyPlayer.changeDevice(deviceId);
        await fetchAvailableDevices(); // Refresh the device list
        const newPlaybackState = await spotifyApi.getCurrentPlaybackState();
        setPlayerState(rabbifyPlayer.getPlayerState());
        console.log('Device changed successfully, new playback state:', newPlaybackState);
        return; // Exit the function if successful
      } catch (error) {
        console.error(`Error changing device (${retries} retries left):`, error);
        retries--;
        if (retries === 0) {
          // If all retries failed, show an error message to the user
          alert('Failed to change device. Please try again later.');
        } else {
          // Wait for a short time before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  };

  const fetchRecentlyPlayed = async () => {
    try {
      const tracks = await spotifyApi.getRecentlyPlayed();
      console.log('Recently played tracks:', tracks);
      const uniqueTracks = tracks.reduce((acc, item) => {
        if (!acc.some(track => track.track.id === item.track.id)) {
          acc.push(item);
        }
        return acc;
      }, []);
      setRecentlyPlayed(uniqueTracks.map(item => item.track));
    } catch (error) {
      console.error('Error fetching recently played tracks:', error);
    }
  };

  const fetchTopTracks = async () => {
    try {
      const tracks = await spotifyApi.getTopTracks();
      console.log('Fetched top tracks:', tracks);
      setTopTracks(tracks);
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      if (error.response && error.response.status === 403) {
        console.error('Access forbidden. Please ensure you have the necessary permissions.');
      }
    }
  };

  const fetchNewReleases = async () => {
    try {
      const releases = await spotifyApi.getNewReleases();
      console.log('New releases:', releases);
      setNewReleases(releases);
    } catch (error) {
      console.error('Error fetching new releases:', error);
    }
  };

  const TrackCard = ({ track, onPlay }) => {
    const albumImage = track.album?.images?.[0]?.url || 
                       track.images?.[0]?.url ||
                       '/default-album-art.jpg';
    const trackName = track.name || 'Unknown Track';
    const artistName = track.artists?.[0]?.name || 'Unknown Artist';
    const trackUri = track.uri;

    return (
      <Card className="flex flex-col hover:shadow-lg transition-shadow duration-300">
        <CardContent className="flex-1 flex flex-col p-4">
          <img 
            src={albumImage}
            alt={trackName}
            className="w-full aspect-square object-cover mb-4 rounded-md" 
          />
          <CardTitle className="line-clamp-1 text-lg font-semibold">{trackName}</CardTitle>
          <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-1">{artistName}</p>
          <Button onClick={() => onPlay(trackUri)} className="w-full mt-auto bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white">
            Play
          </Button>
        </CardContent>
      </Card>
    );
  };
  
  const Section = ({ title, tracks }) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {tracks && tracks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {tracks.slice(0, 5).map((track) => (
            <TrackCard key={track.uri || track.id} track={track} onPlay={handlePlay} />
          ))}
        </div>
      ) : (
        <p>No tracks available</p>
      )}
    </div>
  );

  const QueueSection = ({ title, tracks }) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {tracks && tracks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {tracks.map((track) => (
            <TrackCard key={track.uri || track.id} track={track} onPlay={handlePlay} />
          ))}
        </div>
      ) : (
        <p>No tracks available</p>
      )}
    </div>
  );

  const DeviceSelector = ({ devices, activeDevice, onDeviceChange }) => {
    return (
      <Select.Root value={activeDevice} onValueChange={onDeviceChange}>
        <Select.Trigger className="inline-flex items-center justify-center rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-violet11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-violet9 outline-none">
          <Select.Value placeholder="Select a device" />
          <Select.Icon className="text-violet11">
            <ChevronDown />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="overflow-hidden bg-white rounded-md shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]">
            <Select.Viewport className="p-[5px]">
              {devices.length > 0 ? (
                devices.map((device) => (
                  <Select.Item
                    key={`${device.id}-${device.name}`}
                    value={device.id}
                    className="text-[13px] leading-none text-violet11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1"
                  >
                    <Select.ItemText>{device.name}</Select.ItemText>
                    <Select.ItemIndicator className="absolute left-0 w-[25px] inline-flex items-center justify-center">
                      <Check />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))
              ) : (
                <Select.Item disabled>
                  <Select.ItemText>No devices available</Select.ItemText>
                </Select.Item>
              )}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    );
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let timer;
    if (!playerState.isPaused && playerState.trackDuration > 0) {
      timer = setInterval(() => {
        setPlayerState((prevState) => ({
          ...prevState,
          playbackPosition: Math.min(prevState.playbackPosition + 1000, prevState.trackDuration)
        }));
      }, 1000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [playerState.isPaused, playerState.trackDuration]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen w-full bg-[var(--background)] text-[var(--text-primary)]">
        <header className="bg-[var(--surface)] p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--accent)]">Rabbify</h1>
          <div className="flex items-center space-x-4 flex-1 max-w-3xl mx-4">
            <Input
              type="text"
              placeholder="Search for tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} className="w-24">
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              {userProfile && userProfile.images && userProfile.images[0] && (
                <img src={userProfile.images[0].url} alt="Profile" className="w-8 h-8 rounded-full" />
              )}
              <span className="text-sm font-medium">{userProfile?.display_name}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          ) : (
            <Button onClick={handleLogin} variant="outline" size="sm">
              Login with Spotify
            </Button>
          )}
        </header>
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {searchResults.map((track) => (
                  <TrackCard key={track.uri} track={track} onPlay={handlePlay} />
                ))}
              </div>
            ) : (
              <>
                <Section title="Recently Played" tracks={recentlyPlayed} />
                <Section title="Your Top Tracks" tracks={topTracks} />
                <Section title="New Releases" tracks={newReleases} />
                <QueueSection title="Playback Queue" tracks={playerState.playbackQueue} />
              </>
            )}
          </main>
        </div>
        <footer className="bg-[var(--surface)] border-t border-[var(--background)] p-4">
          <div className="flex items-center justify-between">
            <div className="w-1/4">
              {playerState.currentTrack && (
                <div className="flex items-center space-x-4">
                  <img src={playerState.currentTrack.album.images[0].url} alt={playerState.currentTrack.name} className="w-14 h-14 object-cover rounded-md" />
                  <div>
                    <h4 className="font-semibold text-sm">{playerState.currentTrack.name}</h4>
                    <p className="text-xs text-[var(--text-secondary)]">{playerState.currentTrack.artists[0].name}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center space-y-2 w-1/2">
              <div className="flex items-center space-x-4">
                <Button onClick={handleShuffleModeChange} className={`p-2 ${playerState.shuffleMode ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
                  <Shuffle className="w-5 h-5" />
                </Button>
                <Button onClick={handleSkipPrevious} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button
                  onClick={playerState.isPaused ? () => rabbifyPlayer.play() : () => rabbifyPlayer.pause()}
                  className="p-3 bg-[var(--accent)] text-[var(--background)] rounded-full hover:bg-[var(--accent-hover)] transition-colors duration-300"
                  disabled={!rabbifyPlayer || playerState.isLoading}
                >
                  {playerState.isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : playerState.isPaused ? (
                    <Play className="w-6 h-6" />
                  ) : (
                    <Pause className="w-6 h-6" />
                  )}
                </Button>
                <Button onClick={handleSkipNext} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <SkipForward className="w-5 h-5" />
                </Button>
                <Button onClick={handleRepeatModeChange} className={`p-2 ${playerState.repeatMode !== 'off' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
                  <Repeat className="w-5 h-5" />
                </Button>
              </div>
              <div className="w-full max-w-md flex items-center space-x-2">
                <span className="text-xs text-[var(--text-secondary)]">
                  {playerState.currentTrack ? formatTime(playerState.playbackPosition) : '0:00'}
                </span>
                <div className="flex-1 px-2">
                  <Slider
                    className="slider-root"
                    value={[playerState.playbackPosition]}
                    max={playerState.trackDuration}
                    step={1000}
                    onValueChange={(values) => {
                      const seekPosition = (values[0] / playerState.trackDuration) * playerState.trackDuration;
                      handleSeek(seekPosition);
                    }}
                  >
                    <SliderTrack className="slider-track">
                      <SliderRange className="slider-range" />
                    </SliderTrack>
                    <SliderThumb className="slider-thumb" />
                  </Slider>
                </div>
                <span className="text-xs text-[var(--text-secondary)]">
                  {playerState.currentTrack ? formatTime(playerState.trackDuration) : '0:00'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4 w-1/4 justify-end">
              <div className="flex items-center space-x-2 min-w-[150px]">
                <Volume2 className="w-5 h-5 text-[var(--text-secondary)]" />
                <div className="flex-1 px-2">
                  <Slider
                    className="slider-root"
                    value={[playerState.volume]}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                  >
                    <SliderTrack className="slider-track">
                      <SliderRange className="slider-range" />
                    </SliderTrack>
                    <SliderThumb className="slider-thumb" />
                  </Slider>
                </div>
              </div>
              <DeviceSelector
                devices={availableDevices}
                activeDevice={playerState.activeDevice}
                onDeviceChange={handleDeviceChange}
              />
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default RabbifyInterface;