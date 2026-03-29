/* ============================================
   Firebase Configuration & Initialization
   ============================================ */

const firebaseConfig = {
  apiKey: "AIzaSyANXDOeEKxHKCyaCUdKjr-52R3HZdT6nI0",
  authDomain: "icca-mc.firebaseapp.com",
  projectId: "icca-mc",
  storageBucket: "icca-mc.firebasestorage.app",
  messagingSenderId: "257392690759",
  appId: "1:257392690759:web:3c66b97293749bdc989362",
  measurementId: "G-BDPT5F5N7T"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// 한국어 설정
auth.languageCode = 'ko';
