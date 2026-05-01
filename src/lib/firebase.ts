import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit, deleteDoc, increment, onSnapshot } from "firebase/firestore";

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

// 🌍 Detect user country/city from IP
async function detectUserGeo(): Promise<{ country: string; city: string; countryCode: string } | null> {
  try {
    const res = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,city');
    const data = await res.json();
    if (data.status === 'success') {
      return { country: data.country, city: data.city, countryCode: data.countryCode };
    }
    return null;
  } catch {
    return null;
  }
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Detect geo location
    const geo = await detectUserGeo();
    
    // Save or update user login in Firestore
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    
    const geoData = geo ? {
      country: geo.country,
      city: geo.city,
      countryCode: geo.countryCode
    } : {};
    
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        isVIP: false,
        verifiedOrder: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        ...geoData
      });
    } else {
      await setDoc(userRef, { 
        email: user.email,
        lastLoginAt: new Date().toISOString(),
        ...geoData
      }, { merge: true });
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    return null;
  }
}

// 📈 Track site visit (called once per page load)
export async function trackSiteVisit() {
  try {
    const statsRef = doc(db, "siteStats", "visits");
    await setDoc(statsRef, {
      totalVisits: increment(1),
      lastVisitAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to track visit:', err);
  }
}

// 📈 Get total site visits
export async function getSiteVisits(): Promise<number> {
  try {
    const statsRef = doc(db, "siteStats", "visits");
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      return snap.data().totalVisits || 0;
    }
    return 0;
  } catch {
    return 0;
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

export async function checkUserVIP(uid: string) {
  const userRef = doc(db, "users", uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists() && docSnap.data().isVIP === true) {
    const keys: string[] = docSnap.data().activatedKeys || [];
    let hasValidKey = false;
    const currentProducts = docSnap.data().activatedProducts || [];
    const newProducts = new Set<string>(currentProducts);

    for (const keyId of keys) {
      const keyRef = doc(db, "keys", keyId);
      const keySnap = await getDoc(keyRef);
      if (keySnap.exists()) {
        const kd = keySnap.data();
        if (kd.status === 'banned' || kd.status === 'frozen') {
          continue;
        }
        hasValidKey = true;
        const pt = kd.productType || 'spoofer'; // Fallback for old keys
        if (pt && pt !== '') {
          newProducts.add(pt);
        }
      }
    }

    if (hasValidKey) {
      const finalProducts = Array.from(newProducts);
      // Auto-repair if length differs or any item differs
      const needsRepair = finalProducts.length !== currentProducts.length || !finalProducts.every(p => currentProducts.includes(p));
      if (needsRepair) {
        await setDoc(userRef, { activatedProducts: finalProducts }, { merge: true });
      }
      return true;
    }

    if (keys.length > 0) {
      await setDoc(userRef, { isVIP: false }, { merge: true });
    }
    return false;
  }
  return false;
}

// ==========================================
// 🔑 KEY SYSTEM - T3N-XXXXXX-XXXXXX
// ==========================================

function generateKeyId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let part1 = '', part2 = '';
  for (let i = 0; i < 6; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `T3N-${part1}-${part2}`;
}

export function isValidKeyFormat(value: string): boolean {
  return /^T3N-[A-Za-z0-9]{6}-[A-Za-z0-9]{6}$/.test(value.trim());
}

export async function createKeys(count: number, productType: 'spoofer' | 'fortnite'): Promise<string[]> {
  const created: string[] = [];
  const now = new Date().toISOString();
  for (let i = 0; i < Math.min(count, 100); i++) {
    let keyId = generateKeyId();
    let exists = true;
    while (exists) {
      const snap = await getDoc(doc(db, "keys", keyId));
      if (!snap.exists()) { exists = false; } else { keyId = generateKeyId(); }
    }
    await setDoc(doc(db, "keys", keyId), {
      keyId, productType, status: 'unused', createdAt: now,
      activatedAt: null, usedByUid: null, usedByEmail: null,
      usedByName: null, usedByPhoto: null, usedByProvider: null
    });
    created.push(keyId);
  }
  return created;
}

export async function activateKey(keyId: string, uid: string, email: string, userData?: { displayName?: string; photoURL?: string; provider?: string }): Promise<{ success: boolean; error?: string; productType?: string; activatedProducts?: string[] }> {
  const cleaned = keyId.trim();
  if (!isValidKeyFormat(cleaned)) {
    return { success: false, error: 'صيغة المفتاح غير صحيحة. الصيغة الصحيحة: T3N-XXXXXX-XXXXXX' };
  }
  try {
    const keyRef = doc(db, "keys", cleaned);
    const keySnap = await getDoc(keyRef);
    if (!keySnap.exists()) return { success: false, error: 'المفتاح غير موجود' };
    const kd = keySnap.data();
    if (kd.status === 'banned') return { success: false, error: 'هذا المفتاح محظور' };
    if (kd.status === 'frozen') return { success: false, error: 'هذا المفتاح مُجمّد مؤقتاً' };
    if (kd.usedByUid && kd.usedByUid !== uid) return { success: false, error: 'هذا المفتاح مرتبط بحساب آخر' };
    const pt = kd.productType || 'spoofer'; // Fallback for old keys

    if (kd.usedByUid === uid) {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      let prods: string[] = userSnap.exists() ? (userSnap.data().activatedProducts || []) : [];
      
      // Auto-repair on re-activation if missing
      if (pt && !prods.includes(pt)) {
        prods.push(pt);
        await setDoc(userRef, { activatedProducts: prods }, { merge: true });
      }

      return { success: true, productType: pt, activatedProducts: prods };
    }
    const now = new Date();
    await setDoc(keyRef, {
      status: 'active', activatedAt: now.toISOString(),
      usedByUid: uid, usedByEmail: email,
      usedByName: userData?.displayName || null,
      usedByPhoto: userData?.photoURL || null,
      usedByProvider: userData?.provider || 'google',
      productType: pt
    }, { merge: true });
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    const existingProducts: string[] = userSnap.exists() ? (userSnap.data().activatedProducts || []) : [];
    const existingKeys: string[] = userSnap.exists() ? (userSnap.data().activatedKeys || []) : [];
    if (!existingProducts.includes(pt)) existingProducts.push(pt);
    if (!existingKeys.includes(cleaned)) existingKeys.push(cleaned);
    await setDoc(userRef, {
      isVIP: true, activatedProducts: existingProducts, activatedKeys: existingKeys,
      email, verifiedAt: now.toISOString()
    }, { merge: true });
    return { success: true, productType: pt, activatedProducts: existingProducts };
  } catch (err: any) {
    console.error('activateKey error:', err);
    if (err?.code === 'permission-denied') return { success: false, error: 'ليس لديك صلاحية' };
    return { success: false, error: 'حدث خطأ: ' + (err?.message || 'غير معروف') };
  }
}

export async function getAllKeys() {
  const snap = await getDocs(collection(db, "keys"));
  const keys: any[] = [];
  snap.forEach((d) => keys.push({ id: d.id, ...d.data() }));
  return keys.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function deleteKey(keyId: string) {
  const ref = doc(db, "keys", keyId);
  const snap = await getDoc(ref);
  if (snap.exists() && snap.data().usedByUid) {
    const userRef = doc(db, "users", snap.data().usedByUid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const prods = (userSnap.data().activatedProducts || []).filter((p: string) => p !== snap.data().productType);
      const keys = (userSnap.data().activatedKeys || []).filter((k: string) => k !== keyId);
      await setDoc(userRef, { activatedProducts: prods, activatedKeys: keys, isVIP: prods.length > 0 }, { merge: true });
    }
  }
  await deleteDoc(ref);
}

export async function deleteAllKeys() {
  const snap = await getDocs(collection(db, "keys"));
  for (const d of snap.docs) {
    await deleteKey(d.id);
  }
  await wipeAllLegacyData();
}

export async function banKey(keyId: string) {
  const ref = doc(db, "keys", keyId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await setDoc(ref, { status: 'banned' }, { merge: true });
    if (snap.data().usedByUid) {
      const userRef = doc(db, "users", snap.data().usedByUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const prods = (userSnap.data().activatedProducts || []).filter((p: string) => p !== snap.data().productType);
        await setDoc(userRef, { activatedProducts: prods, isVIP: prods.length > 0 }, { merge: true });
      }
    }
  }
}

export async function unbanKey(keyId: string) {
  const ref = doc(db, "keys", keyId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const newStatus = snap.data().usedByUid ? 'active' : 'unused';
    await setDoc(ref, { status: newStatus }, { merge: true });
    if (snap.data().usedByUid) {
      const userRef = doc(db, "users", snap.data().usedByUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const prods = userSnap.data().activatedProducts || [];
        if (!prods.includes(snap.data().productType)) prods.push(snap.data().productType);
        await setDoc(userRef, { activatedProducts: prods, isVIP: true }, { merge: true });
      }
    }
  }
}

export async function freezeKey(keyId: string) {
  const ref = doc(db, "keys", keyId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await setDoc(ref, { status: 'frozen', previousStatus: snap.data().status }, { merge: true });
    if (snap.data().usedByUid) {
      const userRef = doc(db, "users", snap.data().usedByUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const prods = (userSnap.data().activatedProducts || []).filter((p: string) => p !== snap.data().productType);
        await setDoc(userRef, { activatedProducts: prods, isVIP: prods.length > 0 }, { merge: true });
      }
    }
  }
}

export async function unfreezeKey(keyId: string) {
  const ref = doc(db, "keys", keyId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const newStatus = snap.data().previousStatus || (snap.data().usedByUid ? 'active' : 'unused');
    await setDoc(ref, { status: newStatus, previousStatus: null }, { merge: true });
    if (newStatus === 'active' && snap.data().usedByUid) {
      const userRef = doc(db, "users", snap.data().usedByUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const prods = userSnap.data().activatedProducts || [];
        if (!prods.includes(snap.data().productType)) prods.push(snap.data().productType);
        await setDoc(userRef, { activatedProducts: prods, isVIP: true }, { merge: true });
      }
    }
  }
}

export async function checkKeyStatus(keyId: string): Promise<any> {
  const cleaned = keyId.trim();
  if (!isValidKeyFormat(cleaned)) throw new Error('صيغة المفتاح غير صحيحة');
  const ref = doc(db, "keys", cleaned);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { status: 'not_found' };
  return { ...snap.data() };
}

// ==========================================
// 🔒 ADMIN ACTIONS
// ==========================================

// 📋 Admin Actions Logger
async function logAdminAction(actionType: string, details: string) {
  try {
    const authUser = auth.currentUser;
    if (!authUser) return;
    const logRef = doc(collection(db, "auditLogs"));
    await setDoc(logRef, {
      action: actionType,
      details: details,
      adminEmail: authUser.email,
      adminUid: authUser.uid,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to log admin action:", err);
  }
}

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
  await logAdminAction("BAN_USER", `Banned user ${email} (UID: ${uid}) for: ${reason}`);
}

// ✅ Unban a user
export async function unbanUser(uid: string) {
  const banRef = doc(db, "bannedUsers", uid);
  await deleteDoc(banRef);
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { banned: false }, { merge: true });
  await logAdminAction("UNBAN_USER", `Removed ban from user UID: ${uid}`);
}

// ❌ Remove VIP from user
export async function removeVIP(uid: string) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { isVIP: false }, { merge: true });
  await logAdminAction("REMOVE_VIP", `Removed VIP status from user UID: ${uid}`);
}

// 🗑️ Delete user data completely
export async function deleteUserData(uid: string) {
  const userRef = doc(db, "users", uid);
  await deleteDoc(userRef);
  const banRef = doc(db, "bannedUsers", uid);
  await deleteDoc(banRef);
  await logAdminAction("DELETE_USER", `Deleted all data for user UID: ${uid}`);
}

// 👑 Add another admin
export async function addAdminUser(email: string) {
  const adminRef = doc(db, "admins", email);
  await setDoc(adminRef, {
    addedAt: new Date().toISOString(),
    addedBy: MAIN_ADMIN_EMAIL
  });
  await logAdminAction("ADD_ADMIN", `Added new admin: ${email}`);
}

// 🗑️ Remove an admin
export async function removeAdminUser(email: string) {
  if (email === MAIN_ADMIN_EMAIL) return;
  const adminRef = doc(db, "admins", email);
  await deleteDoc(adminRef);
  await logAdminAction("REMOVE_ADMIN", `Removed admin access for: ${email}`);
}

// 📊 Admin: Get dashboard statistics
export async function getAdminStats() {
  const usersSnap = await getDocs(collection(db, "users"));
  const users: any[] = [];
  let vipCount = 0;
  usersSnap.forEach((d) => {
    const data = d.data();
    users.push({ id: d.id, ...data });
    if (data.isVIP) vipCount++;
  });

  const keysSnap = await getDocs(collection(db, "keys"));
  const keys: any[] = [];
  let spooferKeys = 0, fortniteKeys = 0, usedKeys = 0, unusedKeys = 0, bannedKeys = 0, frozenKeys = 0;
  keysSnap.forEach((d) => {
    const data = d.data();
    keys.push({ id: d.id, ...data });
    if (data.productType === 'spoofer') spooferKeys++;
    if (data.productType === 'fortnite') fortniteKeys++;
    if (data.status === 'active') usedKeys++;
    if (data.status === 'unused') unusedKeys++;
    if (data.status === 'banned') bannedKeys++;
    if (data.status === 'frozen') frozenKeys++;
  });

  const bannedSnap = await getDocs(collection(db, "bannedUsers"));
  const banned: any[] = [];
  bannedSnap.forEach((d) => banned.push({ id: d.id, ...d.data() }));

  const adminsSnap = await getDocs(collection(db, "admins"));
  const admins: any[] = [{ email: MAIN_ADMIN_EMAIL, role: 'مالك' }];
  adminsSnap.forEach((d) => admins.push({ email: d.id, ...d.data(), role: 'مشرف' }));

  const totalVisits = await getSiteVisits();

  return {
    totalUsers: users.length, vipUsers: vipCount,
    totalKeys: keys.length, spooferKeys, fortniteKeys, usedKeys, unusedKeys, bannedKeys, frozenKeys,
    bannedCount: banned.length, totalVisits,
    users: users.sort((a, b) => (b.verifiedAt || b.lastLoginAt || '').localeCompare(a.verifiedAt || a.lastLoginAt || '')),
    keys: keys.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    banned, admins,
  };
}

// ==========================================
// 🔧 MAINTENANCE MODE
// ==========================================

// Toggle maintenance mode on/off
export async function toggleMaintenance(enabled: boolean, message?: string) {
  const ref = doc(db, "settings", "maintenance");
  await setDoc(ref, {
    enabled,
    message: message || 'الموقع تحت الصيانة حالياً، نرجع لكم قريب!',
    updatedAt: new Date().toISOString()
  });
}

// Get current maintenance status
export async function getMaintenanceStatus(): Promise<{ enabled: boolean; message: string }> {
  const ref = doc(db, "settings", "maintenance");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { enabled: snap.data().enabled || false, message: snap.data().message || '' };
  }
  return { enabled: false, message: '' };
}

// 🔔 Listen to notifications (Announcements from Discord)
export function listenToNotifications(callback: (notifs: any[]) => void) {
  const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(50));
  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notifs);
  });
}

// 🗑️ Delete a notification
export async function deleteNotification(notifId: string) {
  const notifRef = doc(db, "notifications", notifId);
  await deleteDoc(notifRef);
}

// ==========================================
// 📱 PHONE AUTHENTICATION
// ==========================================

export function initRecaptcha(containerId: string) {
  // @ts-ignore
  if (!window.recaptchaVerifier) {
    try {
      // @ts-ignore
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        'size': 'invisible',
        'callback': () => {},
        'expired-callback': () => {
          // @ts-ignore
          window.recaptchaVerifier?.clear();
          // @ts-ignore
          window.recaptchaVerifier = null;
        }
      });
    } catch (e) {
      console.error("Recaptcha Init Error", e);
    }
  }
  // @ts-ignore
  return window.recaptchaVerifier;
}

export async function sendPhoneSMS(phoneNumber: string, appVerifier: any) {
  try {
    auth.languageCode = 'ar';
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return { success: true, confirmationResult };
  } catch (error: any) {
    console.error('SMS Error:', error);
    let msg = error.code + ': ' + error.message;
    if (error.code === 'auth/invalid-phone-number') msg = 'رقم الجوال غير صحيح تأكد من كتابته بشكل صحيح (مثال: +966500000000)';
    if (error.code === 'auth/too-many-requests') msg = 'حدث خطأ، يرجى المحاولة بعد قليل';
    return { success: false, error: msg };
  }
}

export async function verifyPhoneOTP(confirmationResult: any, code: string) {
  try {
    const result = await confirmationResult.confirm(code);
    const user = result.user;
    
    // Save or update user login in Firestore
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        email: user.phoneNumber, // Use phone number as identifier
        isVIP: false,
        verifiedOrder: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
    } else {
      await setDoc(userRef, { lastLoginAt: new Date().toISOString() }, { merge: true });
    }
    return { success: true, user };
  } catch (error: any) {
    console.error('OTP Verify Error:', error);
    return { success: false, error: 'رمز التحقق غير صحيح، تأكد منه وحاول مجدداً' };
  }
}

// 🚧 Maintenance Mode Functions
export function listenToMaintenanceMode(callback: (isMaintenance: boolean) => void) {
  const settingsRef = doc(db, "settings", "global");
  return onSnapshot(settingsRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().maintenance === true);
    } else {
      callback(false);
    }
  });
}

export async function toggleMaintenanceMode(currentState: boolean) {
  const settingsRef = doc(db, "settings", "global");
  await setDoc(settingsRef, { maintenance: !currentState }, { merge: true });
}

export async function wipeAllLegacyData() {
  // Wipe all orders
  const ordersSnap = await getDocs(collection(db, "orders"));
  for (const orderDoc of ordersSnap.docs) {
    await deleteDoc(doc(db, "orders", orderDoc.id));
  }
  
  // Wipe all keys
  const keysSnap = await getDocs(collection(db, "keys"));
  for (const keyDoc of keysSnap.docs) {
    await deleteDoc(doc(db, "keys", keyDoc.id));
  }

  // Reset all users
  const usersSnap = await getDocs(collection(db, "users"));
  for (const userDoc of usersSnap.docs) {
    await setDoc(doc(db, "users", userDoc.id), {
      isVIP: false,
      activatedProducts: [],
      activatedKeys: [],
      verifiedOrder: null
    }, { merge: true });
  }

  return true;
}
