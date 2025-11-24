import * as firebaseApp from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

declare global {
  interface Window {
    __firebase_config?: string;
    __app_id?: string;
    __initial_auth_token?: string;
  }
}

// Robust config retrieval with fallback for demo mode
const getFirebaseConfig = () => {
  try {
    if (typeof window !== 'undefined' && window.__firebase_config) {
      return JSON.parse(window.__firebase_config);
    }
  } catch (e) {
    console.warn("Failed to parse firebase config, falling back to mock", e);
  }
  return { apiKey: "mock", authDomain: "mock", projectId: "mock" };
};

const firebaseConfig = getFirebaseConfig();
export const isMock = firebaseConfig.apiKey === "mock";

const app = firebaseApp.initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = (typeof window !== 'undefined' && window.__app_id) || 'default-app-id';

export const logAudit = async (userId: string, action: string, domain: string, details: any) => {
  if (isMock) return;
  try {
    await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'audit_logs'), {
      action,
      domain,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Audit Log Failed:", err);
  }
};

export const createStockMove = async (userId: string, { productId, productName, qty, from, to, ref }: any) => {
  if (isMock) return;
  try {
    await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'stock_moves'), {
      productId,
      productName,
      qty: parseFloat(qty),
      locationId: from,
      locationDestId: to,
      reference: ref,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Stock Move Failed:", err);
  }
};