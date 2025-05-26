import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Load service account from local file
import serviceAccount from './serviceAccountKey.json';

// Initialize Firebase Admin with the service account file
const app = initializeApp({
  credential: cert(serviceAccount as any),
  storageBucket: `${serviceAccount.project_id}.appspot.com`
});

// Get Firestore instance
export const adminFirestore = getFirestore(app);

// Export app instance
export const adminApp = app;
