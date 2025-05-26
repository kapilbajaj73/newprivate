// Script to create a test user in Firebase Authentication and Firestore
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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
const auth = getAuth(app);
const db = getFirestore(app);

// User details
const email = "admin@onravoice.com";
const password = "admin123";
const userData = {
  username: "admin",
  fullName: "Admin User",
  role: "admin",
  roomId: null,
  email: "admin@onravoice.com"
};

async function createUser() {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`Created user with UID: ${user.uid}`);
    
    // Save user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      ...userData,
      id: user.uid,
      uid: user.uid // Extra field for compatibility
    });
    
    console.log(`User data saved in Firestore`);
    console.log("User creation successful!");
  } catch (error) {
    console.error("Error creating user:", error);
  }
}

// Execute the function
createUser();
