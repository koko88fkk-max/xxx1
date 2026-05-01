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
  const db = admin.firestore();

  try {
    const keyRef = db.collection('keys').doc(cleaned);
    const keySnap = await keyRef.get();

    if (!keySnap.exists) {
      return res.status(404).json({ success: false, error: 'المفتاح غير موجود' });
    }

    const kd = keySnap.data();

    if (kd.status === 'banned') return res.status(403).json({ success: false, error: 'هذا المفتاح محظور' });
    if (kd.status === 'frozen') return res.status(403).json({ success: false, error: 'هذا المفتاح مُجمّد مؤقتاً' });
    if (kd.usedByUid && kd.usedByUid !== uid) return res.status(403).json({ success: false, error: 'هذا المفتاح مرتبط بحساب آخر' });
    
    // Match existing frontend IDs: 'superstar' (Spoofer) and 'fortnite-hack'
    let pt = kd.productType === 'spoofer' ? 'superstar' : (kd.productType || 'superstar');
    if (pt === 'fortnite') pt = 'fortnite-hack'; // Migrate old 'fortnite' keys to 'fortnite-hack'

    // If already activated by the same user, just auto-repair products
    if (kd.usedByUid === uid) {
      const userRef = db.collection('users').doc(uid);
      const userSnap = await userRef.get();
      let prods = userSnap.exists ? (userSnap.data().activatedProducts || []) : [];
      
      if (pt && !prods.includes(pt)) {
        prods.push(pt);
        await userRef.set({ activatedProducts: prods }, { merge: true });
      }
      return res.status(200).json({ success: true, productType: pt, activatedProducts: prods });
    }

    // New Activation
    const now = new Date();
    await keyRef.set({
      status: 'active',
      activatedAt: now.toISOString(),
      usedByUid: uid,
      usedByEmail: email,
      usedByName: userData?.displayName || null,
      usedByPhoto: userData?.photoURL || null,
      usedByProvider: userData?.provider || 'discord',
      productType: pt
    }, { merge: true });

    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    
    const existingProducts = userSnap.exists ? (userSnap.data().activatedProducts || []) : [];
    const existingKeys = userSnap.exists ? (userSnap.data().activatedKeys || []) : [];
    
    if (!existingProducts.includes(pt)) existingProducts.push(pt);
    if (!existingKeys.includes(cleaned)) existingKeys.push(cleaned);

    await userRef.set({
      isVIP: true,
      activatedProducts: existingProducts,
      activatedKeys: existingKeys,
      email,
      verifiedAt: now.toISOString()
    }, { merge: true });

    return res.status(200).json({ success: true, productType: pt, activatedProducts: existingProducts });
  } catch (error) {
    console.error("Activate Key Error:", error);
    return res.status(500).json({ success: false, error: 'حدث خطأ في السيرفر أثناء التفعيل' });
  }
}
