import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyB9mFTUF1_mBzTl3VvxNq5G-mdhrJvzI0A",
  authDomain: "t3n-stor-cd7d7.firebaseapp.com",
  projectId: "t3n-stor-cd7d7",
  storageBucket: "t3n-stor-cd7d7.firebasestorage.app",
  messagingSenderId: "1026259276675",
  appId: "1:1026259276675:web:8b1b49fb23373151531cb6",
  measurementId: "G-273H5TJ98L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function generateKeyId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 6; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `T3N-${p1}-${p2}`;
}

async function run() {
  const keys = [];
  const now = new Date().toISOString();
  for (let i = 0; i < 20; i++) {
    const keyId = generateKeyId();
    await setDoc(doc(db, "keys", keyId), {
      keyId, 
      productType: 'site_access', 
      status: 'unused', 
      createdAt: now,
      activatedAt: null, 
      usedByUid: null, 
      usedByEmail: null,
      usedByName: null, 
      usedByPhoto: null, 
      usedByProvider: null
    });
    keys.push(keyId);
  }
  
  fs.writeFileSync('C:\\Users\\koz\\.gemini\\antigravity-ide\\brain\\c3a245c2-e12b-4c88-935b-167d10ddb459\\site_access_keys.txt', keys.join('\n'), 'utf-8');
  console.log("20 keys generated");
  process.exit(0);
}

run();
