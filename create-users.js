// Script to create initial admin and user accounts in Firebase
const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword,
  signOut
} = require('firebase/auth');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc 
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_vJ2L-J_T6c5FFEr7omDqGFKDCSz_ydI",
  authDomain: "onravoice.firebaseapp.com",
  projectId: "onravoice",
  storageBucket: "onravoice.appspot.com",
  messagingSenderId: "346775933952",
  appId: "1:346775933952:web:6d43edb30a8fe3d0e31e99",
  measurementId: "G-L6P0TK7F0J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Function to create a user with Firestore data
async function createUser(email, password, userData) {
  try {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // Add user data to Firestore
    await setDoc(doc(db, 'users', uid), {
      ...userData,
      id: uid,
      email
    });
    
    console.log(`User created successfully: ${email}`);
    return uid;
  } catch (error) {
    console.error(`Error creating user ${email}:`, error);
    throw error;
  }
}

// Function to create initial rooms
async function createRoom(id, name, capacity, options = {}) {
  try {
    const roomData = {
      id,
      name,
      capacity,
      active: options.active ?? true,
      encrypted: options.encrypted ?? true,
      isolated: options.isolated ?? true,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'rooms', id.toString()), roomData);
    console.log(`Room created successfully: ${name}`);
    return id;
  } catch (error) {
    console.error(`Error creating room ${name}:`, error);
    throw error;
  }
}

// Create users and rooms
async function setupInitialData() {
  try {
    // Create rooms first
    await createRoom(1, 'Main Conference Room', 20);
    await createRoom(2, 'Training Room', 10);
    
    // Create admin user
    await createUser('admin@onravoice.com', 'Admin@123', {
      username: 'admin',
      fullName: 'Administrator',
      role: 'admin',
      roomId: null
    });
    
    // Create regular user
    await createUser('user@onravoice.com', 'User@123', {
      username: 'user',
      fullName: 'Demo User',
      role: 'user',
      roomId: 1
    });
    
    // Sign out after creating users
    await signOut(auth);
    
    console.log('\nInitial setup completed successfully!');
    console.log('\nCredentials:');
    console.log('Admin: admin@onravoice.com / Admin@123');
    console.log('User: user@onravoice.com / User@123');
    
  } catch (error) {
    console.error('Error during setup:', error);
  }
}

// Run the setup
setupInitialData().catch(console.error);