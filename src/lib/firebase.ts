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
    return result.user;
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
  // Check if email is in admins collection
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
    return true;
  }
  return false;
}

// Check if order number was already used by someone else
export async function isOrderUsed(orderId: string, currentUid: string): Promise<{ used: boolean; byCurrentUser: boolean }> {
  const orderRef = doc(db, "usedOrders", orderId);
  const docSnap = await getDoc(orderRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data.usedBy === currentUid) {
      return { used: true, byCurrentUser: true };
    }
    return { used: true, byCurrentUser: false };
  }
  return { used: false, byCurrentUser: false };
}

// Mark user as VIP and lock the order number
export async function markUserAsVIP(uid: string, orderId: string, email: string) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    isVIP: true,
    verifiedOrder: orderId,
    email: email,
    verifiedAt: new Date().toISOString()
  }, { merge: true });

  const orderRef = doc(db, "usedOrders", orderId);
  await setDoc(orderRef, {
    usedBy: uid,
    email: email,
    usedAt: new Date().toISOString()
  });
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
  // Also remove VIP status
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

// ❌ Remove VIP from user (keep their account)
export async function removeVIP(uid: string) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { isVIP: false }, { merge: true });
}

// 🗑️ Delete user data completely
export async function deleteUserData(uid: string, orderId?: string) {
  // Delete user document
  const userRef = doc(db, "users", uid);
  await deleteDoc(userRef);
  // Free up the order number if exists
  if (orderId) {
    const orderRef = doc(db, "usedOrders", orderId);
    await deleteDoc(orderRef);
  }
  // Also remove from banned list if exists
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
  if (email === MAIN_ADMIN_EMAIL) return; // Can't remove main admin!
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

  // Get all used orders
  const ordersSnap = await getDocs(collection(db, "usedOrders"));
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
    users: users.sort((a, b) => (b.verifiedAt || '').localeCompare(a.verifiedAt || '')),
    orders: orders.sort((a, b) => (b.usedAt || '').localeCompare(a.usedAt || '')),
    banned,
    admins,
  };
}
