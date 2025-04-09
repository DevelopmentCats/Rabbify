import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export default async function handler(req, res) {
  const { method, query, body } = req;
  const accessToken = req.cookies.spotifyAccessToken;
  const refreshToken = req.cookies.spotifyRefreshToken;

  console.log('Spotify API handler called with method:', method);
  console.log('Query:', query);
  console.log('Body:', body);

  if (!accessToken || body.action === 'refreshToken') {
    if (refreshToken) {
      try {
        console.log('Attempting to refresh access token');
        spotifyApi.setRefreshToken(refreshToken);
        const data = await spotifyApi.refreshAccessToken();
        spotifyApi.setAccessToken(data.body['access_token']);
        res.setHeader('Set-Cookie', `spotifyAccessToken=${data.body['access_token']}; Path=/; HttpOnly`);
      } catch (error) {
        console.error('Error refreshing access token:', error);
        return res.status(500).json({ error: 'Failed to refresh access token' });
      }
    } else {
      return res.status(401).json({ error: 'No refresh token available' });
    }
  } else {
    spotifyApi.setAccessToken(accessToken);
  }

  try {
    switch (method) {
      case 'GET':
        if (query.action === 'search') {
          const searchResults = await spotifyApi.searchTracks(query.q);
          res.status(200).json(searchResults.body.tracks.items);
        } else if (query.action === 'getCurrentPlayback') {
          const playback = await spotifyApi.getMyCurrentPlaybackState();
          res.status(200).json(playback.body);
        } else if (query.action === 'getRecommendations') {
          const recommendations = await spotifyApi.getRecommendations({
            seed_tracks: query.seed_tracks,
            limit: 20,
          });
          res.status(200).json(recommendations.body.tracks);
        } else if (query.action === 'getAvailableDevices') {
          const devices = await spotifyApi.getMyDevices();
          console.log('Available devices:', devices.body.devices);
          res.status(200).json({ devices: devices.body.devices });
        } else if (query.action === 'getCurrentPlaybackState') {
          const playbackState = await spotifyApi.getMyCurrentPlaybackState();
          res.status(200).json(playbackState.body);
        } else if (query.action === 'getUserProfile') {
          const userProfile = await spotifyApi.getMe();
          res.status(200).json(userProfile.body);
        } else if (query.action === 'getRecentlyPlayed') {
          const recentlyPlayed = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 20 });
          res.status(200).json(recentlyPlayed.body.items);
        } else if (query.action === 'getTopTracks') {
          const topTracks = await spotifyApi.getMyTopTracks({ limit: 20, time_range: 'short_term' });
          console.log('Top tracks from Spotify API:', topTracks.body.items);
          res.status(200).json(topTracks.body.items);
        } else if (query.action === 'getNewReleases') {
          const newReleases = await spotifyApi.getNewReleases({ limit: 20, country: 'US' });
          res.status(200).json(newReleases.body.albums.items);
        } else if (query.action === 'getAccessToken') {
          res.status(200).json(accessToken);
        } else if (query.action === 'getQueue') {
          try {
            const queue = await spotifyApi.getMyCurrentPlaybackState();
            if (queue.body && queue.body.queue) {
              res.status(200).json({ queue: queue.body.queue });
            } else {
              res.status(200).json({ queue: [] });
            }
          } catch (error) {
            console.error('Error fetching queue:', error);
            res.status(error.statusCode || 500).json({ error: 'Failed to fetch queue', details: error.message });
          }
        } else if (query.action === 'getPlaybackQueue') {
          try {
            const queue = await spotifyApi.getMyCurrentPlaybackState();
            if (queue.body && queue.body.queue) {
              res.status(200).json({ queue: queue.body.queue });
            } else {
              res.status(200).json({ queue: [] });
            }
          } catch (error) {
            console.error('Error fetching queue:', error);
            res.status(error.statusCode || 500).json({ error: 'Failed to fetch queue', details: error.message });
          }
        } 
        break;
      case 'POST':
        if (body.action === 'play') {
          const playOptions = {}
          if (body.trackUri) playOptions.uris = [body.trackUri]
          if (body.deviceId) playOptions.device_id = body.deviceId
        
          await spotifyApi.play(playOptions)
          res.status(200).json({ message: 'Playback started' })
        } else if (body.action === 'pause') {
          await spotifyApi.pause(body.deviceId)
          res.status(200).json({ message: 'Playback paused' })
        } else if (body.action === 'skipToNext') {
          await spotifyApi.skipToNext({ device_id: body.device_id });
          res.status(200).json({ message: 'Skipped to next track' });
        } else if (body.action === 'skipToPrevious') {
          await spotifyApi.skipToPrevious({ device_id: body.device_id });
          res.status(200).json({ message: 'Skipped to previous track' });
        } else if (body.action === 'addToQueue') {
          for (const uri of body.uris) {
            await spotifyApi.addToQueue(uri);
          }
          res.status(200).json({ message: 'Tracks added to queue' });
        } else if (body.action === 'registerDevice') {
          // This is a mock implementation as Spotify doesn't have a direct API for this
          // In a real scenario, the device would be automatically registered when the player connects
          console.log(`Registering device: ${body.device_name} (${body.device_id})`);
          res.status(200).json({ message: 'Device registered successfully' });
        } else {
          res.status(400).json({ error: 'Invalid action' });
        }
        break;
      case 'PUT':
        console.log('Received PUT request:', body);
        if (body.action === 'play') {
          const playOptions = {};
          if (body.uris) playOptions.uris = body.uris;
          if (body.device_id) playOptions.device_id = body.device_id;

          console.log('Calling Spotify API play with options:', playOptions);
          await spotifyApi.play(playOptions);
          res.status(200).json({ message: 'Playback started' });
        } else if (body.action === 'pause') {
          const pauseOptions = {};
          if (body.device_id) pauseOptions.device_id = body.device_id;

          console.log('Calling Spotify API pause with options:', pauseOptions);
          await spotifyApi.pause(pauseOptions);
          res.status(200).json({ message: 'Playback paused' });
        } else if (body.action === 'transferPlayback') {
          const transferOptions = {
            deviceIds: body.device_ids,
            play: body.play
          };
          console.log('Transferring playback with options:', transferOptions);
          await spotifyApi.transferMyPlayback(transferOptions.deviceIds, { play: transferOptions.play });
          res.status(200).json({ message: 'Playback transferred' });
        } else if (body.action === 'setVolume') {
          const volumeOptions = {
            volume_percent: body.volume_percent,
            device_id: body.device_id
          };
          console.log('Calling Spotify API setVolume with options:', volumeOptions);
          await spotifyApi.setVolume(volumeOptions.volume_percent, volumeOptions.device_id);
          res.status(200).json({ message: 'Volume set' });
        } else {
          res.status(400).json({ error: 'Invalid action for PUT method' });
        }
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in Spotify API handler:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request method:', method);
    console.error('Request query:', query);
    console.error('Request body:', body);
    if (error.statusCode === 403) {
      return res.status(403).json({ error: 'Forbidden', details: 'You may not have the necessary permissions for this action.' });
    }
    res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
  }
}