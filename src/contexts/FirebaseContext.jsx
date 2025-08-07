import React, { createContext, useContext, useState, useEffect } from 'react';
import { app, db, auth } from '../config/firebase';
import { setFirestoreInstance as setStreamerFirestore, firebaseStreamerService } from '../services/firebaseStreamerService';
import { setFirestoreInstance as setTeamFirestore, firebaseTeamService } from '../services/firebaseTeamService';

const FirebaseContext = createContext();

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase deve ser usado dentro de um FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider = ({ children }) => {
  const [firebaseApp] = useState(app);
  const [firestore] = useState(db);
  const [authInstance] = useState(auth);
  const [isConfigured] = useState(true);
  const [error, setError] = useState(null);

  // Inicializa o serviço Firebase ao carregar
  useEffect(() => {
    try {
      // Inicializa ambos os serviços
      setStreamerFirestore(db);
      setTeamFirestore(db);
      firebaseStreamerService.initialize(db);
      firebaseTeamService.initialize(db);
      console.log('Firebase inicializado com sucesso');
    } catch (err) {
      console.error('Erro ao inicializar Firebase:', err);
      setError(err.message);
    }
  }, []);



  // Testa conexão com Firebase
  const testConnection = async () => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const testDoc = doc(firestore, 'test', 'connection');
      await getDoc(testDoc);
      return { success: true, message: 'Conexão bem-sucedida!' };
    } catch (err) {
      console.error('Erro ao testar conexão:', err);
      return { success: false, message: err.message };
    }
  };

  const value = {
    // Estado
    firebaseApp,
    firestore,
    auth: authInstance,
    isConfigured,
    error,
    
    // Métodos
    testConnection
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export default FirebaseProvider;