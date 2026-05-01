import axios from 'axios';

// Product name to type mapping
// Add your Salla product names here (case-insensitive match)
const PRODUCT_TYPE_MAP = [
  { keywords: ['هاك فورت', 'hack fortnite', 'fortnite hack', 'هاك'], type: 'fortnite-hack' },
  { keywords: ['فورت', 'فورت نايت', 'fortnite'], type: 'fortnite' },
  { keywords: ['فك باند', 'unban', 'ban', 'سبوفر', 'spoofer', 'perm', 'superstar', 'سوبر ستار'], type: 'superstar' },
];

function detectProductType(productName = '') {
  const lower = productName.toLowerCase();
  for (const rule of PRODUCT_TYPE_MAP) {
    if (rule.keywords.some(k => lower.includes(k.toLowerCase()))) {
      return rule.type;
    }
  }
  return 'superstar'; // Default fallback
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Security: Verify secret key from Make
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.MAKE_SECRET_KEY || 't3n-make-secret-2024';
  if (apiKey !== expectedKey) {
    console.error('Unauthorized request - invalid API key');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { orderId, productName, customerEmail } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 't3n-stor-cd7d7';
  const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;

  if (!FIREBASE_API_KEY) {
    return res.status(500).json({ error: 'Firebase config missing' });
  }

  const productType = detectProductType(productName || '');
  const cleanedOrderId = String(orderId).trim();

  try {
    // Save order to Firestore
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/orders/${cleanedOrderId}?key=${FIREBASE_API_KEY}`;

    const orderDoc = {
      fields: {
        orderId: { stringValue: cleanedOrderId },
        productName: { stringValue: productName || '' },
        productType: { stringValue: productType },
        customerEmail: { stringValue: customerEmail || '' },
        status: { stringValue: 'active' },
        source: { stringValue: 'salla_make' },
        createdAt: { timestampValue: new Date().toISOString() },
      }
    };

    await axios.patch(firestoreUrl, orderDoc, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`[save-order] ✅ Order ${cleanedOrderId} saved as type: ${productType}`);
    return res.status(200).json({ success: true, orderId: cleanedOrderId, productType });

  } catch (err) {
    console.error('[save-order] Firestore error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to save order to Firebase', details: err.response?.data });
  }
}
