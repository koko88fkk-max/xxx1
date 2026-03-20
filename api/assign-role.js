export default async function handler(req, res) {
  // تفعيل CORS عشان نضمن إن الدالة تقدر تستقبل الطلبات
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { discordId, accessToken } = req.body;
  if (!discordId || !accessToken) {
    return res.status(400).json({ error: 'يجب توفير ID الديسكورد وتوكن الصلاحية' });
  }

  // يجب وضع هذه المتغيرات في اعدادات Vercel Environment Variables
  const BOT_TOKEN = process.env.BOT_TOKEN; 
  const GUILD_ID = process.env.GUILD_ID || '1396959491786018826';
  const ROLE_ID = process.env.ROLE_ID || '1397221350095192074';

  if (!BOT_TOKEN) {
    return res.status(500).json({ 
      error: "خطأ في السيرفر: التوكن الخاص بالبوت غير موجود. يرجى إضافته في Vercel (BOT_TOKEN)" 
    });
  }

  try {
    // 1. محاولة إدخال العميل للسيرفر وإعطائه الرتبة
    const response = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        access_token: accessToken,
        roles: [ROLE_ID]
      })
    });
    
    // 2. لو كان العميل موجود مسبقاً في السيرفر، الديسكورد بيرد بـ 204 No Content
    // وقتها لازم نعطيه הרتبة بشكل مباشر بدال ما نضيفه
    if (response.status === 204) {
      const roleResponse = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${ROLE_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${BOT_TOKEN}`
        }
      });
      if (!roleResponse.ok) {
        const err = await roleResponse.json().catch(()=>({}));
        return res.status(400).json({ 
          error: 'فشل في إعطاء الرتبة للعميل الموجو مسبقاً', 
          details: err 
        });
      }
    } else if (!response.ok && response.status !== 201) {
       const err = await response.json().catch(()=>({}));
       return res.status(400).json({ 
         error: 'فشل في إدخال العميل للسيرفر أو إغاب الرتبة', 
         details: err 
       });
    }

    res.json({ success: true, message: 'تم إعطاء الرتبة بنجاح!' });
  } catch (error) {
    console.error('Error assigning role:', error.message);
    res.status(500).json({ error: 'مشكلة داخلية في الاتصال مع ديسكورد', details: error.message });
  }
}
