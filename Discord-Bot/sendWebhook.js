const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function sendWebhook() {
  const webhookUrl = 'https://discord.com/api/webhooks/1472310780375339069/VRmlsf-92gRHzXEtJicZHL983GLLky0rFrsaZeqwisiUrPvz7iWpxnOKRVApQNe3oB4T';

  const embed = {
    title: '🌟 **الطريقة الشاملة لتفعيل السبوفر!** 🌟',
    description: `**1️⃣ الدخول لمنصة تعن:**
ادخل الموقع وسجل دخول بحسابك في قوقل من خلال الرابط:
[https://t3n-2a2i.vercel.app/](https://t3n-2a2i.vercel.app/)

**2️⃣ شرح البوابة:**
أول ما تدخل الموقع، توجه لقسم "شرح بوابة تعن" وشوفه عشان تفهم كل شيء.

**3️⃣ تفعيل رتبة العميل:**
بعد ما تحط "رقم الطلب" الخاص فيك، راح توصلك رتبة عميل مميز في نفس الموقع تلقائياً.

**4️⃣ الدليل الشامل:**
بعدها بتلاقي في القوائم فوق: "شرح الاسبوفر" و "حل مشاكل عامة" لأي مشكلة ممكن تواجهك.
⚠️ **تنبيه:** كل شيء موضح بالتفصيل.. امشي خطوة بخطوة عشان تفهم تماماً وتسوي كل شيء صح.

**5️⃣ التقييم والآراء ⭐️:**
بعد انتهائك من الخدمة لا تنسى تقيمنا في المتجر والديسكورد.. دعمك يفيدنا!
💬 [اضغط هنا لتقييمنا في الديسكورد](https://discord.com/channels/1396959491786018826/1397221014215331891)
🛒 [اضغط هنا لمتجر تعن الرسمي](https://salla.sa/t3nn)`,
    color: 0x00E5FF, // Cyan neon color
    image: {
      url: 'attachment://media__1773838309598.jpg'
    },
    footer: {
      text: 'T3N Management Team'
    }
  };

  const form = new FormData();
  form.append('payload_json', JSON.stringify({ embeds: [embed] }));
  
  // Attach the user's uploaded background image
  form.append('file1', fs.createReadStream('C:\\Users\\koz\\.gemini\\antigravity\\brain\\8179df1d-4a92-4f00-be91-ea276ae49564\\media__1773838309598.jpg'));

  try {
    await axios.post(webhookUrl, form, {
      headers: form.getHeaders(),
    });
    console.log('✅ Webhook message sent successfully!');
  } catch (err) {
    console.error('❌ Failed to send webhook:', err.response?.data || err.message);
  }
}

sendWebhook();
