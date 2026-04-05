import axios from 'axios';

// In-memory IP Cache for Serverless Rate Limiting
const ipCache = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 دقيقة
const MAX_REQUESTS_PER_IP = 15; // 15 طلب كحد أقصى في الدقيقة

export default async function handler(req, res) {
  // CORS setup (Secure Domain Whitelist)
  const origin = req.headers.origin;
  const isAllowedOrigin = origin && (
    origin === 'https://t3n-stor.com' || 
    origin === 'http://localhost:5173' || 
    origin.endsWith('.vercel.app')
  );
  
  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback strict domain
    res.setHeader('Access-Control-Allow-Origin', 'https://t3n-stor.com');
  }

  res.setHeader('Access-Control-Allow-Credentials', true)
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

  // ==== الحماية: 0. Rate Limiting (حماية من هجمات الـ DDoS والـ Brute Force للـ API) ====
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const currentTime = Date.now();
  
  if (ipCache.has(clientIp)) {
    const ipData = ipCache.get(clientIp);
    if (currentTime - ipData.startTime < RATE_LIMIT_WINDOW) {
      if (ipData.count >= MAX_REQUESTS_PER_IP) {
        console.warn(`[RATE LIMIT ALARM] Blocked IP: ${clientIp}`);
        return res.status(429).json({ error: 'تم حظر طلباتك مؤقتاً. جرب بعد دقيقة.' });
      }
      ipData.count++;
    } else {
      ipCache.set(clientIp, { count: 1, startTime: currentTime });
    }
  } else {
    ipCache.set(clientIp, { count: 1, startTime: currentTime });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const GUILD_ID = process.env.GUILD_ID || '1396959491786018826';
  const ROLE_ID = process.env.ROLE_ID || '1397221350095192074';
  const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "t3n-stor-cd7d7";

  if (!FIREBASE_API_KEY) {
    console.error("FATAL: FIREBASE_API_KEY is missing in Vercel environment variables");
    return res.status(500).json({ error: "خطأ أمني: الـ API Key الخاص بـ Firebase غير موجود في السيرفر." });
  }

  if (!BOT_TOKEN) {
    console.error("FATAL: BOT_TOKEN is missing in Vercel environment variables");
    return res.status(500).json({
      error: "خطأ في السيرفر: التوكن الخاص بالبوت غير موجود. يرجى إضافته في Vercel (BOT_TOKEN)"
    });
  }

  // ==== الحماية: 1. التحقق من الهوية المشفرة ====
  let verifiedUid;
  let userEmail = 'غير متوفر';
  try {
    const authRes = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
      idToken
    });
    if (!authRes.data.users || authRes.data.users.length === 0) throw new Error("No user found for token");
    verifiedUid = authRes.data.users[0].localId;
    userEmail = authRes.data.users[0].email || 'غير متوفر';
  } catch (err) {
    console.error("Identity verification failed:", err.response?.data || err.message);
    return res.status(403).json({ error: 'مرفوض طلب مزيف: توكن الحماية غير صالح الجلسة.' });
  }

  // ==== الحماية: 2. التحقق من حالة مفتاح الـ VIP للعميل ====
  let orderNumber = 'غير متوفر';
  let lastRoleAssignTime = null;
  try {
    const docRes = await axios.get(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${verifiedUid}`);
    const isVIP = docRes.data.fields?.isVIP?.booleanValue;
    orderNumber = docRes.data.fields?.verifiedOrder?.stringValue || 'غير متوفر';
    lastRoleAssignTime = docRes.data.fields?.lastRoleAssign?.timestampValue || null;

    if (isVIP !== true) {
      console.error(`User ${verifiedUid} attempted assignment but isVIP is false.`);
      return res.status(403).json({ error: 'مرفوض: لا تملك مفتاح VIP فعّال للحصول على الرتبة الدائمة.' });
    }

    // ==== الحماية: 2.5 منع السبام للمستخدم الصالح (User Rate Limit) ====
    if (lastRoleAssignTime) {
      const lastTime = new Date(lastRoleAssignTime);
      const diffSeconds = (new Date().getTime() - lastTime.getTime()) / 1000;
      if (diffSeconds < 60) {
         console.warn(`[SPAM PREVENTION] User ${verifiedUid} clicked too fast.`);
         return res.status(429).json({ error: 'لقد قمت بطلب الرتبة للتو! يرجى الانتظار دقيقة قبل المحاولة مرة أخرى.' });
      }
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

    // ==== منع تكرار الإشعار عبر Firestore (يحمي من الضغط المتعدد) ====
    const now = new Date();
    const nowISO = now.toISOString();
    let shouldSendLog = true;

    if (lastRoleAssignTime) {
      const lastTime = new Date(lastRoleAssignTime);
      const diffSeconds = (now.getTime() - lastTime.getTime()) / 1000;
      if (diffSeconds < 30) {
        shouldSendLog = false;
        console.log("Duplicate log prevented (within 30s) for:", verifiedUid);
      }
    }

    // تحديث وقت آخر ربط في Firestore
    try {
      await axios.patch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${verifiedUid}?updateMask.fieldPaths=lastRoleAssign`,
        { fields: { lastRoleAssign: { timestampValue: nowISO } } }
      );
    } catch (e) {
      console.error("Failed to update lastRoleAssign:", e.message);
    }

    // ==== إرسال إشعار مختصر ورسمي لروم السجلات ====
    if (shouldSendLog) {
      const LOG_CHANNEL_ID = '1472360395363586138';
      try {
        const userRes = await axios.get(`https://discord.com/api/v10/users/@me`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const user = userRes.data;
        const avatarURL = user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
          : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;

        const createdDate = new Date((Number(user.id) / 4194304) + 1420070400000);
        const ageDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        const ageYears = Math.floor(ageDays / 365);
        const ageMonths = Math.floor((ageDays % 365) / 30);
        const ageText = ageYears > 0 ? `${ageYears} سنة و ${ageMonths} شهر` : `${ageMonths} شهر و ${ageDays % 30} يوم`;

        const embed = {
          embeds: [{
            title: 'عملية ربط رتبة جديدة',
            color: 0x2563EB,
            thumbnail: { url: avatarURL },
            fields: [
              { name: 'العميل', value: `<@${user.id}>`, inline: true },
              { name: 'الرتبة', value: `<@&${ROLE_ID}>`, inline: true },
              { name: 'رقم الطلب', value: `\`${orderNumber}\``, inline: true },
              { name: 'الإيميل', value: `\`${userEmail}\``, inline: true },
              { name: 'عمر الحساب', value: `\`${ageText}\``, inline: true },
              { name: 'التاريخ', value: `\`${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}\``, inline: true },
            ],
            footer: {
              text: 'T3N Security System',
            },
          }]
        };

        await axios.post(
          `https://discord.com/api/v10/channels/${LOG_CHANNEL_ID}/messages`,
          embed,
          { headers: { 'Authorization': `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' } }
        );
        console.log("Log embed sent successfully to channel.");
      } catch (logErr) {
        console.error("Failed to send log embed (non-critical):", logErr.response?.data || logErr.message);
      }
    }

    res.json({ success: true, message: 'تم إعطاء الرتبة بنجاح!' });
  } catch (error) {
    console.error('Unhandled Error assigning role:', error);
    res.status(500).json({ error: 'مشكلة داخلية في الاتصال مع ديسكورد', details: error.message });
  }
}
