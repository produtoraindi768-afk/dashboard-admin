// Configuração do Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBqJ8K9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y",
  authDomain: "dashboard-f0217.firebaseapp.com",
  projectId: "dashboard-f0217",
  storageBucket: "dashboard-f0217.appspot.com",
  messagingSenderId: "791615571",
  appId: "1:791615571:web:abc123def456ghi789"
};

// Inicializa o Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Inicializa o Firestore
export const db = getFirestore(firebaseApp);

// Inicializa o Auth (para futuras implementações)
export const auth = getAuth(firebaseApp);

// Exporta o app como named export
export const app = firebaseApp;

export default firebaseApp;