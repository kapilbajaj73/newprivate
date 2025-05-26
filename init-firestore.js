// Script to initialize Firestore collections and security rules
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc } from "firebase/firestore";

// Firebase configuration from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyDuqp40fnQQvheS-OoNiosiQN5riMjOSew",
  authDomain: "onra-voice-app.firebaseapp.com",
  projectId: "onra-voice-app",
  storageBucket: "onra-voice-app.firebasestorage.app",
  messagingSenderId: "838111561981",
  appId: "1:838111561981:android:ede68a8dd3138b4927d694"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create initial counter document if it doesn't exist
async function initializeCounters() {
  try {
    const counterRef = doc(db, 'counters', 'app-counters');
    const counterSnap = await getDoc(counterRef);
    
    if (!counterSnap.exists()) {
      await setDoc(counterRef, {
        userId: 2,      // Start at 2 since admin is 1
        roomId: 2,      // Start at 2 since main room is 1
        recordingId: 1  // Start at 1 for recordings
      });
      console.log('Initialized counter document');
    } else {
      console.log('Counter document already exists');
    }
  } catch (error) {
    console.error('Error initializing counters:', error);
  }
}

// Create initial admin user
async function createAdminUser(uid) {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        id: uid,
        username: "admin",
        fullName: "Admin User",
        email: "admin@onravoice.com",
        role: "admin",
        roomId: null
      });
      console.log('Created admin user');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Create initial room
async function createInitialRoom() {
  try {
    const roomRef = doc(db, 'rooms', '1');
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      await setDoc(roomRef, {
        id: 1,
        name: "Main Conference Room",
        capacity: 20,
        active: true,
        encrypted: true,
        isolated: true
      });
      console.log('Created initial room');
    } else {
      console.log('Initial room already exists');
    }
  } catch (error) {
    console.error('Error creating initial room:', error);
  }
}

// Run initialization
async function initializeFirestore() {
  console.log('Initializing Firestore...');
  
  // Check if admin user exists from Firebase Auth or provide a default UID
  const adminUid = 's9ehrGFdR4VBrW1dGwT7l4DRTIx1'; // This should be the UID from Firebase Auth
  
  await initializeCounters();
  await createAdminUser(adminUid);
  await createInitialRoom();
  
  console.log('Firestore initialization complete');
}

initializeFirestore();
