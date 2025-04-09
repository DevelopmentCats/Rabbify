import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export default async function handler(req, res) {
  const { code, action } = req.query;

  if (action === 'logout') {
    res.setHeader('Set-Cookie', [
      'spotifyAccessToken=; HttpOnly; Path=/; Max-Age=0',
      'spotifyRefreshToken=; HttpOnly; Path=/; Max-Age=0'
    ]);
    return res.redirect('/');
  }

  console.log('Auth handler called');
  console.log('SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID);
  console.log('SPOTIFY_CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET);
  console.log('SPOTIFY_REDIRECT_URI:', process.env.SPOTIFY_REDIRECT_URI);

  if (!code) {
    const scopes = [
      'user-read-private', 'user-read-email', 'user-modify-playback-state',
      'user-read-playback-state', 'user-library-read', 'streaming',
      'user-read-recently-played', 'playlist-read-private',
      'playlist-read-collaborative', 'playlist-modify-public',
      'playlist-modify-private', 'app-remote-control', 'user-top-read',
      'user-follow-read', 'user-follow-modify', 'user-read-playback-position',
      'user-read-currently-playing'
    ];
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    console.log('Redirecting to Spotify authorization URL:', authorizeURL);
    res.redirect(authorizeURL);
  } else {
    try {
      console.log('Received authorization code:', code);
      console.log('Attempting to exchange code for tokens');
      const data = await spotifyApi.authorizationCodeGrant(code);
      console.log('Token exchange successful');
      const { access_token, refresh_token, expires_in } = data.body;

      res.setHeader('Set-Cookie', [
        `spotifyAccessToken=${access_token}; HttpOnly; Path=/; Max-Age=${expires_in}; SameSite=Lax`,
        `spotifyRefreshToken=${refresh_token}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax` // 30 days
      ]);

      res.redirect('/?login=success');
    } catch (error) {
      console.error('Error in Spotify auth handler:', error);
      console.error('Error details:', error.response?.data || error.message);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }
}
