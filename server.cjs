const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = '';
const GUILD_ID = '1396959491786018826';
const ROLE_ID = '1397221350095192074';

app.post('/api/assign-role', async (req, res) => {
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
    if (response.status === 204 || response.status === 200) {
      await axios.put(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${ROLE_ID}`,
        {},
        {
          headers: {
            'Authorization': `Bot ${BOT_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Audit-Log-Reason': 'Verified Customer via T3N Website'
          }
        }
      ).catch(e => console.log('Already has role or minor assign error:', e.message));
    }

    res.json({ success: true, message: 'Role assigned successfully!' });
  } catch (error) {
    console.error('Error assigning role:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to assign role', details: error.response?.data });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Discord Backend API starting on port ${PORT}...`);
});
