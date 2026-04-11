const firebaseConfig = {
  apiKey: "AIzaSyChEJpXOZeo9vEwpo5G8u_wyFvfys58Zsg",
  authDomain: "proyecto1-82852.firebaseapp.com",
  projectId: "proyecto1-82852",
  storageBucket: "proyecto1-82852.firebasestorage.app",
  messagingSenderId: "841105504907",
  appId: "1:841105504907:web:4b396ca21d6c7a2c7df28e",
  measurementId: "G-YNNPECWJD9"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Firestore (Base de Datos)
const db = firebase.firestore();
