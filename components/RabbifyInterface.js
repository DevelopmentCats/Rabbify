import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Slider } from './ui/slider';
import { Music, Search, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle } from 'lucide-react';
import spotifyApi from '../lib/spotifyAPI';

const RabbifyInterface = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [repeatMode, setRepeatMode] = useState('off');
  const [shuffleMode, setShuffleMode] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    window.location.href = '/api/auth';
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('access_token');
    if (token) {
      setAccessToken(token);
      spotifyApi.setAccessToken(token);
      getCurrentPlayback().then(setCurrentTrack).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      console.log('Access token set:', accessToken.substring(0, 10) + '...');
    }
  }, [accessToken]);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const results = await search(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = async (trackUri) => {
    await play(trackUri);
    setIsPlaying(true);
  };

  const handlePause = async () => {
    await pause();
    setIsPlaying(false);
  };

  const handleSkipNext = async () => {
    await skipToNext();
    getCurrentPlayback().then(setCurrentTrack);
  };

  const handleSkipPrevious = async () => {
    await skipToPrevious();
    getCurrentPlayback().then(setCurrentTrack);
  };

  const handleVolumeChange = async (newVolume) => {
    await setVolume(newVolume);
    setVolume(newVolume);
  };

  const handleRepeatModeChange = async () => {
    const newMode = repeatMode === 'off' ? 'track' : repeatMode === 'track' ? 'context' : 'off';
    await setRepeatMode(newMode);
    setRepeatMode(newMode);
  };

  const handleShuffleModeChange = async () => {
    const newMode = !shuffleMode;
    await setShuffle(newMode);
    setShuffleMode(newMode);
  };

  return (
    <div className="bg-black text-orange-400 min-h-screen flex items-center justify-center p-6">
      <Card className="bg-gray-900 border-orange-400 w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-orange-400 text-3xl rabbit-ears">Rabbify: Hop into the Beat!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Search for a song"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800 text-orange-400 border-orange-400 flex-grow"
            />
            <Button onClick={handleSearch} className="bg-orange-400 text-black hover:bg-orange-500 rabbit-hop" disabled={isLoading}>
              {isLoading ? (
                <span className="animate-spin mr-2">🐰</span>
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Hopping...' : 'Search'}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <Select
              options={searchResults.map((track) => ({ value: track.uri, label: `${track.name} - ${track.artists[0].name}` }))}
              onChange={(option) => handlePlay(option.value)}
              className="bg-gray-800 text-orange-400 border-orange-400 w-full"
            />
          )}

          {currentTrack && (
            <div className="text-center">
              <h3 className="text-lg font-semibold">{currentTrack.name}</h3>
              <p>{currentTrack.artists.map((artist) => artist.name).join(', ')}</p>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <Button onClick={handleSkipPrevious} className="bg-orange-400 text-black hover:bg-orange-500 rabbit-hop">
              <SkipBack className="w-6 h-6" />
            </Button>
            <Button onClick={isPlaying ? handlePause : handlePlay} className="bg-orange-400 text-black hover:bg-orange-500 rabbit-hop">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            <Button onClick={handleSkipNext} className="bg-orange-400 text-black hover:bg-orange-500 rabbit-hop">
              <SkipForward className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Music className="w-6 h-6 text-orange-400" />
            <Slider
              min={0}
              max={100}
              value={volume}
              onChange={handleVolumeChange}
              className="flex-grow"
            />
            <span className="text-orange-400 w-8 text-center">{volume}%</span>
          </div>

          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleRepeatModeChange}
              className={`bg-gray-800 hover:bg-gray-700 rabbit-hop ${repeatMode !== 'off' ? 'text-orange-400' : 'text-gray-400'}`}
            >
              <Repeat className="w-6 h-6" />
            </Button>
            <Button
              onClick={handleShuffleModeChange}
              className={`bg-gray-800 hover:bg-gray-700 rabbit-hop ${shuffleMode ? 'text-orange-400' : 'text-gray-400'}`}
            >
              <Shuffle className="w-6 h-6" />
            </Button>
          </div>

          {!accessToken && (
            <Button onClick={handleLogin} className="w-full rabbit-hop">
              Login to Spotify
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RabbifyInterface;