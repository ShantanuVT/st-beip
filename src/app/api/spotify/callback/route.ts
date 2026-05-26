import { NextRequest, NextResponse } from 'next/server';

/**
 * Spotify OAuth Callback Route
 *
 * Receives the authorization code from Spotify after the user
 * logs in via PKCE flow. Exchanges the code for access + refresh
 * tokens and returns an HTML page that stores them in localStorage
 * and redirects the user back to the app.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle Spotify auth errors (user denied, etc.)
  if (error) {
    const errorPage = createRedirectPage(
      '/?spotify-auth-error=' + encodeURIComponent(error)
    );
    return new NextResponse(errorPage, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (!code) {
    const errorPage = createRedirectPage('/?spotify-auth-error=no_code');
    return new NextResponse(errorPage, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Get the code verifier from cookie (set by client before redirect)
  const codeVerifier = request.cookies.get('spotify_code_verifier')?.value;
  if (!codeVerifier) {
    const errorPage = createRedirectPage('/?spotify-auth-error=no_verifier');
    return new NextResponse(errorPage, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  if (!clientId) {
    const errorPage = createRedirectPage('/?spotify-auth-error=no_client_id');
    return new NextResponse(errorPage, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    // Exchange the authorization code for tokens using PKCE
    // Use the same redirect URI as the client — must match exactly what was
    // sent in the authorization request, otherwise Spotify rejects it.
    // We derive it from the request origin so it works seamlessly on any domain.
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || `${request.nextUrl.origin}/api/spotify/callback`;

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Spotify token exchange failed:', tokenResponse.status, errorText);
      const errorPage = createRedirectPage('/?spotify-auth-error=token_exchange');
      return new NextResponse(errorPage, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const tokenData = await tokenResponse.json();

    // Create credentials object for localStorage
    const credentials = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || '',
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    };

    // Return an HTML page that stores the tokens and redirects
    const successPage = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Spotify Connected</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #0a0a0f;
      color: #e0e0e0;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #1ed760;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 1rem auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { font-size: 14px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="#1ed760">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
    <h2 style="color: #fff;">Connected to Spotify</h2>
    <div class="spinner"></div>
    <p>Redirecting you back...</p>
  </div>
  <script>
    try {
      localStorage.setItem('spotify_credentials', JSON.stringify(${JSON.stringify(credentials)}));
      // Set a flag so the app knows auth just completed
      localStorage.setItem('spotify_auth_just_completed', 'true');
    } catch (e) {
      console.error('Failed to store credentials:', e);
    }
    window.location.href = '/';
  </script>
</body>
</html>`;

    return new NextResponse(successPage, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (err) {
    console.error('Spotify callback error:', err);
    const errorPage = createRedirectPage('/?spotify-auth-error=exception');
    return new NextResponse(errorPage, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

function createRedirectPage(url: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Redirecting...</title>
  <script>window.location.href = '${url}';</script>
</head>
<body></body>
</html>`;
}
