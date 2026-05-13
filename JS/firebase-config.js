const firebaseConfig = {
  apiKey: "AIzaSyAPr9Dwy5DI-HBMDzYSrtiLADjVtGwscuQ",
  authDomain: "proyecto-87089.firebaseapp.com",
  projectId: "proyecto-87089",
  storageBucket: "proyecto-87089.firebasestorage.app",
  messagingSenderId: "106263965426",
  appId: "1:106263965426:web:4e1546e641281a49c7ea6b",
  measurementId: "G-TB3BYYDGSP"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Firestore (Base de Datos)
const db = firebase.firestore();
