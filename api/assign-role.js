import axios from 'axios';

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log("Starting assign-role POST request");

  const { discordId, accessToken, idToken } = req.body;
  if (!discordId || !accessToken || !idToken) {
    console.error("Missing discordId, accessToken, or idToken in body");
    return res.status(400).json({ error: 'يجب توفير ID الديسكورد وتوكن الحماية للوصول' });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN; 
  const GUILD_ID = process.env.GUILD_ID || '1396959491786018826';
  const ROLE_ID = process.env.ROLE_ID || '1397221350095192074';
  const FIREBASE_API_KEY = "AIzaSyB9mFTUF1_mBzTl3VvxNq5G-mdhrJvzI0A";
  const FIREBASE_PROJECT_ID = "t3n-stor-cd7d7";

  if (!BOT_TOKEN) {
    console.error("FATAL: BOT_TOKEN is missing in Vercel environment variables");
    return res.status(500).json({ 
      error: "خطأ في السيرفر: التوكن الخاص بالبوت غير موجود. يرجى إضافته في Vercel (BOT_TOKEN)" 
    });
  }

  // ==== الحماية: 1. التحقق من الهوية المشفرة ====
  let verifiedUid;
  try {
    const authRes = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
      idToken
    });
    if (!authRes.data.users || authRes.data.users.length === 0) throw new Error("No user found for token");
    verifiedUid = authRes.data.users[0].localId;
  } catch (err) {
    console.error("Identity verification failed:", err.response?.data || err.message);
    return res.status(403).json({ error: 'مرفوض طلب مزيف: توكن الحماية غير صالح الجلسة.' });
  }

  // ==== الحماية: 2. التحقق من حالة مفتاح الـ VIP للعميل ====
  try {
    const docRes = await axios.get(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${verifiedUid}`);
    const isVIP = docRes.data.fields?.isVIP?.booleanValue;
    if (isVIP !== true) {
      console.error(`User ${verifiedUid} attempted assignment but isVIP is false.`);
      return res.status(403).json({ error: 'مرفوض: لا تملك مفتاح VIP فعّال للحصول على الرتبة الدائمة.' });
    }
  } catch (err) {
    console.error("Firestore user verification failed:", err.response?.data || err.message);
    return res.status(500).json({ error: 'فشل الاتصال بقاعدة البيانات للتحقق من صلاحيتك.' });
  }


  try {
    console.log(`Adding member ${discordId} to guild ${GUILD_ID}`);
    // 1. محاولة إدخال العميل للسيرفر وإعطائه الرتبة
    let response;
    try {
      response = await axios.put(
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
    } catch (err) {
      console.error("Axios PUT to add member failed:", err.response?.data || err.message);
      return res.status(500).json({ error: 'فشل في إدخال العميل للسيرفر (ديسكورد رفض الطلب)', details: err.response?.data });
    }
    
    // 2. لو كان العميل موجود مسبقاً في السيرفر، الديسكورد بيرد بـ 204 No Content
    if (response.status === 204) {
      console.log(`User already in guild. Assigning role ${ROLE_ID} directly.`);
      try {
        await axios.put(
          `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${ROLE_ID}`,
          {},
          {
            headers: {
              'Authorization': `Bot ${BOT_TOKEN}`
            }
          }
        );
      } catch (err) {
        console.error("Axios PUT to assign role failed:", err.response?.data || err.message);
        return res.status(500).json({ error: 'العميل موجود بالسيرفر لكن فشل إعطائه الرتبة', details: err.response?.data });
      }
    }

    console.log("Success! Role assigned successfully.");
    res.json({ success: true, message: 'تم إعطاء الرتبة بنجاح!' });
  } catch (error) {
    console.error('Unhandled Error assigning role:', error);
    res.status(500).json({ error: 'مشكلة داخلية في الاتصال مع ديسكورد', details: error.message });
  }
}
