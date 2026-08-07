import admin from 'firebase-admin';

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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Ensure Firebase Admin is initialized
  if (!admin.apps.length) {
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  const { keyId, uid, email, userData } = req.body;

  if (!keyId || !uid || !email) {
    return res.status(400).json({ success: false, error: 'Missing required parameters' });
  }

  const cleaned = keyId.trim();

  // Any key starting with T3N (case-insensitive) is valid for anyone without user/use limits!
  if (!cleaned.toUpperCase().startsWith('T3N')) {
    return res.status(400).json({ success: false, error: 'صيغة المفتاح غير صحيحة. يجب أن يبدأ المفتاح بـ T3N' });
  }

  const pt = 'superstar';
  const allProducts = ['superstar', 'fortnite', 'fortnite-hack'];
  const now = new Date().toISOString();

  try {
    if (admin.apps.length) {
      const db = admin.firestore();

      // Record key usage (non-blocking, allows unlimited users & uses)
      const keyRef = db.collection('keys').doc(cleaned);
      const keySnap = await keyRef.get();
      const usesCount = keySnap.exists ? ((keySnap.data()?.usesCount || 0) + 1) : 1;

      await keyRef.set({
        keyId: cleaned,
        status: 'active',
        lastActivatedAt: now,
        usesCount,
        productType: pt
      }, { merge: true });

      // Grant products and VIP to user
      const userRef = db.collection('users').doc(uid);
      const userSnap = await userRef.get();

      let existingProducts = userSnap.exists ? (userSnap.data()?.activatedProducts || []) : [];
      let existingKeys = userSnap.exists ? (userSnap.data()?.activatedKeys || []) : [];

      allProducts.forEach(p => {
        if (!existingProducts.includes(p)) existingProducts.push(p);
      });
      if (!existingKeys.includes(cleaned)) existingKeys.push(cleaned);

      await userRef.set({
        isVIP: true,
        activatedProducts: existingProducts,
        activatedKeys: existingKeys,
        email: email || (userSnap.exists ? userSnap.data()?.email : 'user@t3n.com'),
        verifiedAt: now
      }, { merge: true });

      return res.status(200).json({
        success: true,
        productType: pt,
        activatedProducts: existingProducts
      });
    }

    return res.status(200).json({
      success: true,
      productType: pt,
      activatedProducts: allProducts
    });
  } catch (error) {
    console.error("Activate Key Error:", error);
    // Unconditional success for T3N key even if DB write fails
    return res.status(200).json({
      success: true,
      productType: pt,
      activatedProducts: allProducts
    });
  }
}
