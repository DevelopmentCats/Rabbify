import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export default async function handler(req, res) {
  const { method, query, body } = req;
  const accessToken = req.headers.authorization?.split(' ')[1];

  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  spotifyApi.setAccessToken(accessToken);

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
        }
        break;

      case 'POST':
        if (body.action === 'play') {
          await spotifyApi.play({ uris: [body.trackUri] });
          res.status(200).json({ message: 'Playback started' });
        } else if (body.action === 'pause') {
          await spotifyApi.pause();
          res.status(200).json({ message: 'Playback paused' });
        } else if (body.action === 'skipToNext') {
          await spotifyApi.skipToNext();
          res.status(200).json({ message: 'Skipped to next track' });
        } else if (body.action === 'skipToPrevious') {
          await spotifyApi.skipToPrevious();
          res.status(200).json({ message: 'Skipped to previous track' });
        }
        break;

      case 'PUT':
        if (body.action === 'setVolume') {
          await spotifyApi.setVolume(body.volume);
          res.status(200).json({ message: 'Volume set' });
        } else if (body.action === 'setRepeatMode') {
          await spotifyApi.setRepeat(body.mode);
          res.status(200).json({ message: 'Repeat mode set' });
        } else if (body.action === 'setShuffle') {
          await spotifyApi.setShuffle(body.state);
          res.status(200).json({ message: 'Shuffle mode set' });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in Spotify API handler:', error.message, error.stack);
    res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
  }
}