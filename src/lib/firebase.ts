import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

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
    // If the same user used it before, allow them
    if (data.usedBy === currentUid) {
      return { used: true, byCurrentUser: true };
    }
    // Different user tried to use it
    return { used: true, byCurrentUser: false };
  }
  return { used: false, byCurrentUser: false };
}

// Mark user as VIP and lock the order number
export async function markUserAsVIP(uid: string, orderId: string, email: string) {
  // Save user as VIP
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    isVIP: true,
    verifiedOrder: orderId,
    email: email,
    verifiedAt: new Date().toISOString()
  }, { merge: true });

  // Lock the order number so no one else can use it
  const orderRef = doc(db, "usedOrders", orderId);
  await setDoc(orderRef, {
    usedBy: uid,
    email: email,
    usedAt: new Date().toISOString()
  });
}
