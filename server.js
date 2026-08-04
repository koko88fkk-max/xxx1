import express from 'express';
import cors from 'cors';
import axios from 'axios';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

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

const app = express();

// 🔒 Security: Only allow requests from your Vercel website
app.use(cors({
  origin: ['https://t3n-2a2i.vercel.app'],
  methods: ['POST'],
}));
app.use(express.json());

// 🔒 Security: Read secrets from environment variables (not hardcoded!)
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID || '1396959491786018826';
const ROLE_ID = process.env.ROLE_ID || '1397221350095192074';

// 🔒 Security: Simple rate limiting (1 request per IP every 30 seconds)
const rateLimitMap = new Map();
function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.ip;
  const now = Date.now();
  const lastRequest = rateLimitMap.get(ip);
  if (lastRequest && now - lastRequest < 30000) {
    return res.status(429).json({ error: 'Too many requests. Please wait 30 seconds.' });
  }
  rateLimitMap.set(ip, now);
  next();
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, time] of rateLimitMap) {
    if (now - time > 60000) rateLimitMap.delete(ip);
  }
}, 300000);

app.post('/api/assign-role', rateLimit, async (req, res) => {
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'Server misconfigured: missing BOT_TOKEN' });
  }

  const { discordId, accessToken } = req.body;
  if (!discordId || !accessToken) {
    return res.status(400).json({ error: 'Missing discordId or accessToken' });
  }

  try {
    // Attempt to Add user to guild with the role
    const response = await axios.put(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`,
      {
        access_token: accessToken,
        roles: [ROLE_ID]
      },
      {
        headers: {
          'Authorization': `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // If the user was already in the server, the above PUT returns 204 No Content.
    // In this case, we need to manually assign the role using PATCH/PUT.
    if (response.status === 204) {
      await axios.put(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${ROLE_ID}`,
        {},
        {
          headers: {
            'Authorization': `Bot ${BOT_TOKEN}`
          }
        }
      );
    }

    res.json({ success: true, message: 'Role assigned successfully!' });
  } catch (error) {
    console.error('Error assigning role:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to assign role', details: error.response?.data });
  }
});

// Discord Auth Callback (for local dev)
app.get('/api/discord-auth', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect('/');
  }

  const clientId = '1462977086653464729'; 
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  
  // Dynamic Redirect URI
  const protocol = req.headers['x-forwarded-proto'] || (req.connection && req.connection.encrypted ? 'https' : 'http');
  const host = req.headers.host;
  const redirectUri = `${protocol}://${host}/api/discord-auth`;

  if (!clientSecret || !admin.apps.length) {
    return res.status(500).send("Server configuration error. Missing DISCORD_CLIENT_SECRET or FIREBASE_PRIVATE_KEY in local .env");
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
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Discord Role Backend running on port ${PORT}`);
});
