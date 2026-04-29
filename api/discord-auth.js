import admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firebase Admin (Only once)
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : "";

  if (privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || 't3n-stor-cd7d7',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@t3n-stor-cd7d7.iam.gserviceaccount.com',
        privateKey: privateKey,
      }),
    });
  }
}

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.redirect('/');
  }

  const clientId = '1462977086653464729'; 
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  
  // This redirect URI must EXACTLY match Discord Developer Settings
  const redirectUri = 'https://t3n-2a2i.vercel.app/api/discord-auth';

  if (!clientSecret || !admin.apps.length) {
    return res.status(500).send("Server configuration error. Set variables in Vercel.");
  }

  try {
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: "Bearer " + accessToken },
    });

    const userData = userResponse.data;
    const discordUid = "discord_" + userData.id; 
    const avatarHash = userData.avatar;
    const avatarUrl = avatarHash 
      ? "https://cdn.discordapp.com/avatars/" + userData.id + "/" + avatarHash + ".png"
      : "https://cdn.discordapp.com/embed/avatars/0.png";
    const displayName = userData.global_name || userData.username;

    try {
      await admin.auth().updateUser(discordUid, {
        displayName: displayName,
        photoURL: avatarUrl,
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        await admin.auth().createUser({
          uid: discordUid,
          displayName: displayName,
          photoURL: avatarUrl,
        });
      } else { throw error; }
    }

    const customToken = await admin.auth().createCustomToken(discordUid);
    res.redirect("/?token=" + customToken);

  } catch (error) {
    console.error("Discord Auth Error:", error.response?.data || error.message);
    res.status(500).send('Discord Authentication failed');
  }
}
