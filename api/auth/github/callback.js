// GitHub OAuth Callback - Exchange code for token and get user info
export default async function handler(req, res) {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Token error:', tokenData);
      return res.redirect('/?error=token_error');
    }

    const accessToken = tokenData.access_token;

    // Get user info from GitHub
    const userResponse = await fetch('https://github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    const userData = await userResponse.json();

    // Get user email (may need separate call if email is private)
    let email = userData.email;
    if (!email) {
      const emailResponse = await fetch('https://github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      const emails = await emailResponse.json();
      const primaryEmail = emails.find(e => e.primary) || emails[0];
      email = primaryEmail?.email;
    }

    // Create user object
    const user = {
      id: `github_${userData.id}`,
      name: userData.name || userData.login,
      email: email || `${userData.login}@github.user`,
      avatar: userData.avatar_url,
      provider: 'github',
    };

    // Encode user data to pass to frontend
    const userParam = encodeURIComponent(JSON.stringify(user));
    
    // Redirect to frontend with user data
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    res.redirect(`${baseUrl}/auth/callback?user=${userParam}&provider=github`);
    
  } catch (error) {
    console.error('OAuth error:', error);
    res.redirect('/?error=oauth_failed');
  }
}

