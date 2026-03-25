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
        verifiedOrder: null,
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
    const orderId = docSnap.data().verifiedOrder;
    if (orderId) {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        // Check if order is banned or frozen
        if (orderData.status === 'banned' || orderData.status === 'frozen') {
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
// 📦 ORDER NUMBER SYSTEM
// ==========================================

// Validate order number format: starts with "24" and 9 digits total
export function isValidOrderFormat(value: string): boolean {
  return /^24\d{7}$/.test(value.trim());
}

// 📦 Validate and activate an order number
export async function activateOrder(orderId: string, uid: string, email: string): Promise<{ success: boolean; error?: string }> {
  const cleaned = orderId.trim();
  
  // Validate format: 24XXXXXXX (9 digits starting with 24)
  if (!isValidOrderFormat(cleaned)) {
    return { success: false, error: 'رقم الطلب غير صحيح' };
  }

  const orderRef = doc(db, "orders", cleaned);
  const orderSnap = await getDoc(orderRef);

  if (orderSnap.exists()) {
    const orderData = orderSnap.data();

    if (orderData.status === 'banned') {
      return { success: false, error: 'رقم الطلب هذا محظور' };
    }

    if (orderData.status === 'frozen') {
      return { success: false, error: 'رقم الطلب هذا مُجمّد مؤقتاً' };
    }

    // Already used by someone else
    if (orderData.usedByUid && orderData.usedByUid !== uid) {
      return { success: false, error: 'رقم الطلب هذا مرتبط بحساب آخر' };
    }

    // Same user re-entering - allow
    if (orderData.usedByUid === uid) {
      return { success: true };
    }
  }

  // Activate the order (create or update)
  const now = new Date();
  
  await setDoc(orderRef, {
    status: 'active',
    activatedAt: now.toISOString(),
    usedByEmail: email,
    usedByUid: uid
  }, { merge: true });

  // Mark user as VIP
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    isVIP: true,
    verifiedOrder: cleaned,
    email: email,
    verifiedAt: now.toISOString()
  }, { merge: true });

  return { success: true };
}

// 📦 Delete an order
export async function deleteOrder(orderId: string) {
  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);
  if (orderSnap.exists()) {
    const orderData = orderSnap.data();
    if (orderData.usedByUid) {
      const userRef = doc(db, "users", orderData.usedByUid);
      await setDoc(userRef, { isVIP: false }, { merge: true });
    }
  }
  await deleteDoc(orderRef);
}

// 📦 Ban an order
export async function banOrder(orderId: string) {
  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);
  if (orderSnap.exists()) {
    const orderData = orderSnap.data();
    await setDoc(orderRef, { status: 'banned' }, { merge: true });
    if (orderData.usedByUid) {
      const userRef = doc(db, "users", orderData.usedByUid);
      await setDoc(userRef, { isVIP: false }, { merge: true });
    }
  }
}

// 📦 Unban an order
export async function unbanOrder(orderId: string) {
  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);
  if (orderSnap.exists()) {
    const orderData = orderSnap.data();
    let newStatus = 'active';
    if (orderData.usedByUid) {
      const userRef = doc(db, "users", orderData.usedByUid);
      await setDoc(userRef, { isVIP: true }, { merge: true });
    }
    await setDoc(orderRef, { status: newStatus }, { merge: true });
  }
}

// 📦 Freeze an order temporarily
export async function freezeOrder(orderId: string) {
  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);
  if (orderSnap.exists()) {
    const orderData = orderSnap.data();
    await setDoc(orderRef, { status: 'frozen', previousStatus: orderData.status }, { merge: true });
    if (orderData.usedByUid) {
      const userRef = doc(db, "users", orderData.usedByUid);
      await setDoc(userRef, { isVIP: false }, { merge: true });
    }
  }
}

// 📦 Unfreeze an order
export async function unfreezeOrder(orderId: string) {
  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);
  if (orderSnap.exists()) {
    const orderData = orderSnap.data();
    let newStatus = orderData.previousStatus || 'active';
    if (newStatus === 'active' && orderData.usedByUid) {
      const userRef = doc(db, "users", orderData.usedByUid);
      await setDoc(userRef, { isVIP: true }, { merge: true });
    }
    await setDoc(orderRef, { status: newStatus, previousStatus: null }, { merge: true });
  }
}

// 📦 Get all orders for admin
export async function getAllOrders() {
  const ordersSnap = await getDocs(collection(db, "orders"));
  const orders: any[] = [];
  ordersSnap.forEach((d) => {
    const data = d.data();
    orders.push({ id: d.id, ...data });
  });
  return orders.sort((a, b) => (b.activatedAt || b.createdAt || '').localeCompare(a.activatedAt || a.createdAt || ''));
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
export async function deleteUserData(uid: string) {
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

  // Get all orders
  const ordersSnap = await getDocs(collection(db, "orders"));
  const orders: any[] = [];
  ordersSnap.forEach((d) => {
    orders.push({ id: d.id, ...d.data() });
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
    totalOrders: orders.length,
    bannedCount: banned.length,
    users: users.sort((a, b) => (b.verifiedAt || b.lastLoginAt || '').localeCompare(a.verifiedAt || a.lastLoginAt || '')),
    orders: orders.sort((a, b) => (b.activatedAt || b.createdAt || '').localeCompare(a.activatedAt || a.createdAt || '')),
    banned,
    admins,
  };
}
