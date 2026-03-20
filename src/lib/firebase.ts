import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB9mFTUF1_mBzTl3VvxNq5G-mdhrJvzI0A",
  authDomain: "t3n-stor-cd7d7.firebaseapp.com",
  projectId: "t3n-stor-cd7d7",
  storageBucket: "t3n-stor-cd7d7.firebasestorage.app",
  messagingSenderId: "1026259276675",
  appId: "1:1026259276675:web:8b1b49fb23373151531cb6",
  measurementId: "G-273H5TJ98L"
};

// 🔒 Main Admin email - ALWAYS has access
const MAIN_ADMIN_EMAIL = "koko.88.fkk@gmail.com";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Save or update user login in Firestore
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        isVIP: false,
        verifiedKey: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
    } else {
      await setDoc(userRef, { 
        email: user.email,
        lastLoginAt: new Date().toISOString() 
      }, { merge: true });
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    return null;
  }
}

export async function logout() {
  await signOut(auth);
}

// 🔒 Check if user is Admin (main admin or added admins)
export async function checkIsAdmin(email: string | null): Promise<boolean> {
  if (!email) return false;
  if (email === MAIN_ADMIN_EMAIL) return true;
  const adminRef = doc(db, "admins", email);
  const adminSnap = await getDoc(adminRef);
  return adminSnap.exists();
}

// Sync check (for quick UI checks - only checks main admin)
export function isAdmin(email: string | null): boolean {
  return email === MAIN_ADMIN_EMAIL;
}

// 🔒 Check if user is banned
export async function checkBanned(uid: string): Promise<{ banned: boolean; reason?: string }> {
  const banRef = doc(db, "bannedUsers", uid);
  const banSnap = await getDoc(banRef);
  if (banSnap.exists()) {
    return { banned: true, reason: banSnap.data().reason || 'محظور من الموقع' };
  }
  return { banned: false };
}

// Check if user is VIP
export async function checkUserVIP(uid: string) {
  const userRef = doc(db, "users", uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists() && docSnap.data().isVIP === true) {
    // Also check if the key they used is still valid (not expired)
    const keyId = docSnap.data().verifiedKey;
    if (keyId) {
      const keyRef = doc(db, "keys", keyId);
      const keySnap = await getDoc(keyRef);
      if (keySnap.exists()) {
        const keyData = keySnap.data();
        // Check expiration
        if (keyData.activatedAt) {
          const activatedTime = new Date(keyData.activatedAt).getTime();
          const now = Date.now();
          const hours24 = 24 * 60 * 60 * 1000;
          if (now - activatedTime > hours24) {
            // Key expired - remove VIP
            await setDoc(userRef, { isVIP: false }, { merge: true });
            await setDoc(keyRef, { status: 'expired' }, { merge: true });
            return false;
          }
        }
        // Check if key is banned or frozen
        if (keyData.status === 'banned' || keyData.status === 'frozen') {
          await setDoc(userRef, { isVIP: false }, { merge: true });
          return false;
        }
      }
    }
    return true;
  }
  return false;
}

// ==========================================
// 🔑 KEY SYSTEM
// ==========================================

// Generate a random key segment (6 chars: A-Z, a-z, 0-9)
function generateSegment(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

// 🔑 Generate a unique key: T3N-XXXXXX-XXXXXX
export async function generateKey(): Promise<string> {
  let key = '';
  let exists = true;
  // Keep generating until we get a unique key
  while (exists) {
    key = `T3N-${generateSegment(6)}-${generateSegment(6)}`;
    const keyRef = doc(db, "keys", key);
    const keySnap = await getDoc(keyRef);
    exists = keySnap.exists();
  }
  // Save the key
  const keyRef = doc(db, "keys", key);
  await setDoc(keyRef, {
    status: 'unused', // unused | active | expired | banned | frozen
    createdAt: new Date().toISOString(),
    activatedAt: null,
    usedByEmail: null,
    usedByUid: null,
    expiresAt: null
  });
  return key;
}

// 🔑 Validate and activate a key
export async function activateKey(keyId: string, uid: string, email: string): Promise<{ success: boolean; error?: string }> {
  const cleaned = keyId.trim().toUpperCase().replace(/\s/g, '');
  
  // Validate format: T3N-XXXXXX-XXXXXX
  if (!/^T3N-[A-Za-z0-9]{6}-[A-Za-z0-9]{6}$/i.test(keyId.trim())) {
    return { success: false, error: 'صيغة المفتاح غير صحيحة' };
  }

  const keyRef = doc(db, "keys", keyId.trim());
  const keySnap = await getDoc(keyRef);

  if (!keySnap.exists()) {
    return { success: false, error: 'المفتاح غير موجود' };
  }

  const keyData = keySnap.data();

  if (keyData.status === 'banned') {
    return { success: false, error: 'هذا المفتاح محظور' };
  }

  if (keyData.status === 'frozen') {
    return { success: false, error: 'هذا المفتاح مُجمّد مؤقتاً' };
  }

  if (keyData.status === 'expired') {
    return { success: false, error: 'هذا المفتاح منتهي الصلاحية' };
  }

  if (keyData.status === 'active') {
    // Check if still within 24 hours
    if (keyData.activatedAt) {
      const activatedTime = new Date(keyData.activatedAt).getTime();
      const now = Date.now();
      const hours24 = 24 * 60 * 60 * 1000;
      if (now - activatedTime > hours24) {
        await setDoc(keyRef, { status: 'expired' }, { merge: true });
        return { success: false, error: 'هذا المفتاح منتهي الصلاحية' };
      }
    }
    // Already used by someone
    if (keyData.usedByUid && keyData.usedByUid !== uid) {
      return { success: false, error: 'هذا المفتاح مستخدم من شخص آخر' };
    }
    // Same user re-entering - allow
    if (keyData.usedByUid === uid) {
      return { success: true };
    }
  }

  // Activate the key
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  await setDoc(keyRef, {
    status: 'active',
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    usedByEmail: email,
    usedByUid: uid
  }, { merge: true });

  // Mark user as VIP
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    isVIP: true,
    verifiedKey: keyId.trim(),
    email: email,
    verifiedAt: now.toISOString()
  }, { merge: true });

  return { success: true };
}

// 🔑 Delete a key
export async function deleteKey(keyId: string) {
  const keyRef = doc(db, "keys", keyId);
  await deleteDoc(keyRef);
}

// 🔑 Ban a key
export async function banKey(keyId: string) {
  const keyRef = doc(db, "keys", keyId);
  const keySnap = await getDoc(keyRef);
  if (keySnap.exists()) {
    const keyData = keySnap.data();
    await setDoc(keyRef, { status: 'banned' }, { merge: true });
    // If someone is using it, remove their VIP
    if (keyData.usedByUid) {
      const userRef = doc(db, "users", keyData.usedByUid);
      await setDoc(userRef, { isVIP: false }, { merge: true });
    }
  }
}

// 🔑 Unban a key (sets back to unused or active based on timing)
export async function unbanKey(keyId: string) {
  const keyRef = doc(db, "keys", keyId);
  const keySnap = await getDoc(keyRef);
  if (keySnap.exists()) {
    const keyData = keySnap.data();
    let newStatus = 'unused';
    if (keyData.activatedAt) {
      const activatedTime = new Date(keyData.activatedAt).getTime();
      const now = Date.now();
      const hours24 = 24 * 60 * 60 * 1000;
      if (now - activatedTime > hours24) {
        newStatus = 'expired';
      } else {
        newStatus = 'active';
        // Restore VIP if still active
        if (keyData.usedByUid) {
          const userRef = doc(db, "users", keyData.usedByUid);
          await setDoc(userRef, { isVIP: true }, { merge: true });
        }
      }
    }
    await setDoc(keyRef, { status: newStatus }, { merge: true });
  }
}

// 🔑 Freeze a key temporarily
export async function freezeKey(keyId: string) {
  const keyRef = doc(db, "keys", keyId);
  const keySnap = await getDoc(keyRef);
  if (keySnap.exists()) {
    const keyData = keySnap.data();
    await setDoc(keyRef, { status: 'frozen', previousStatus: keyData.status }, { merge: true });
    // Remove VIP if someone is using the key
    if (keyData.usedByUid) {
      const userRef = doc(db, "users", keyData.usedByUid);
      await setDoc(userRef, { isVIP: false }, { merge: true });
    }
  }
}

// 🔑 Unfreeze a key
export async function unfreezeKey(keyId: string) {
  const keyRef = doc(db, "keys", keyId);
  const keySnap = await getDoc(keyRef);
  if (keySnap.exists()) {
    const keyData = keySnap.data();
    let newStatus = keyData.previousStatus || 'unused';
    // Check if expired
    if (keyData.activatedAt) {
      const activatedTime = new Date(keyData.activatedAt).getTime();
      const now = Date.now();
      const hours24 = 24 * 60 * 60 * 1000;
      if (now - activatedTime > hours24) {
        newStatus = 'expired';
      } else if (newStatus === 'active' && keyData.usedByUid) {
        // Restore VIP
        const userRef = doc(db, "users", keyData.usedByUid);
        await setDoc(userRef, { isVIP: true }, { merge: true });
      }
    }
    await setDoc(keyRef, { status: newStatus, previousStatus: null }, { merge: true });
  }
}

// 🔑 Get all keys for admin
export async function getAllKeys() {
  const keysSnap = await getDocs(collection(db, "keys"));
  const keys: any[] = [];
  keysSnap.forEach((d) => {
    const data = d.data();
    keys.push({ id: d.id, ...data });
  });
  return keys.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

// ==========================================
// 🔒 ADMIN ACTIONS
// ==========================================

// 🚫 Ban a user
export async function banUser(uid: string, email: string, reason: string) {
  const banRef = doc(db, "bannedUsers", uid);
  await setDoc(banRef, {
    email: email,
    reason: reason,
    bannedAt: new Date().toISOString()
  });
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { isVIP: false, banned: true }, { merge: true });
}

// ✅ Unban a user
export async function unbanUser(uid: string) {
  const banRef = doc(db, "bannedUsers", uid);
  await deleteDoc(banRef);
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { banned: false }, { merge: true });
}

// ❌ Remove VIP from user
export async function removeVIP(uid: string) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { isVIP: false }, { merge: true });
}

// 🗑️ Delete user data completely
export async function deleteUserData(uid: string, keyId?: string) {
  const userRef = doc(db, "users", uid);
  await deleteDoc(userRef);
  const banRef = doc(db, "bannedUsers", uid);
  await deleteDoc(banRef);
}

// 👑 Add another admin
export async function addAdminUser(email: string) {
  const adminRef = doc(db, "admins", email);
  await setDoc(adminRef, {
    addedAt: new Date().toISOString(),
    addedBy: MAIN_ADMIN_EMAIL
  });
}

// 🗑️ Remove an admin
export async function removeAdminUser(email: string) {
  if (email === MAIN_ADMIN_EMAIL) return;
  const adminRef = doc(db, "admins", email);
  await deleteDoc(adminRef);
}

// 📊 Admin: Get dashboard statistics
export async function getAdminStats() {
  // Get all users
  const usersSnap = await getDocs(collection(db, "users"));
  const users: any[] = [];
  let vipCount = 0;
  usersSnap.forEach((d) => {
    const data = d.data();
    users.push({ id: d.id, ...data });
    if (data.isVIP) vipCount++;
  });

  // Get all keys
  const keysSnap = await getDocs(collection(db, "keys"));
  const keys: any[] = [];
  keysSnap.forEach((d) => {
    keys.push({ id: d.id, ...d.data() });
  });

  // Get banned users
  const bannedSnap = await getDocs(collection(db, "bannedUsers"));
  const banned: any[] = [];
  bannedSnap.forEach((d) => {
    banned.push({ id: d.id, ...d.data() });
  });

  // Get admins list
  const adminsSnap = await getDocs(collection(db, "admins"));
  const admins: any[] = [{ email: MAIN_ADMIN_EMAIL, role: 'مالك' }];
  adminsSnap.forEach((d) => {
    admins.push({ email: d.id, ...d.data(), role: 'مشرف' });
  });

  return {
    totalUsers: users.length,
    vipUsers: vipCount,
    totalKeys: keys.length,
    bannedCount: banned.length,
    users: users.sort((a, b) => (b.verifiedAt || b.lastLoginAt || '').localeCompare(a.verifiedAt || a.lastLoginAt || '')),
    keys: keys.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    banned,
    admins,
  };
}
