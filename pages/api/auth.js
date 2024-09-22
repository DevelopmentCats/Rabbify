import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    const scopes = ['user-read-private', 'user-read-email', 'user-modify-playback-state', 'user-read-playback-state', 'user-library-read'];
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    res.redirect(authorizeURL);
  } else {
    try {
      const data = await spotifyApi.authorizationCodeGrant(code);
      const { access_token, refresh_token, expires_in } = data.body;

      // In a real application, you should securely store these tokens
      // For this example, we'll redirect back to the frontend with the access token
      res.redirect(`/?access_token=${access_token}`);
    } catch (error) {
      console.error('Error in Spotify auth handler:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}