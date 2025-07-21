import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDyNYOPu4Qk7xaIdPufMNpgXof_ljmW8xs",
  authDomain: "twitter-a9aa2.firebaseapp.com",
  projectId: "twitter-a9aa2",
  storageBucket: "twitter-a9aa2.firebasestorage.app",
  messagingSenderId: "766364930269",
  appId: "1:766364930269:web:bb01dc504d29650d5d8b34",
  measurementId: "G-HWRNME7BJH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Observes the authentication state.
async function initializeAuthObserver() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        console.log('Sessão de usuário detectada:', user.uid);
      } else {
        console.log('Nenhum usuário logado. Redirecionando para login se necessário.');
      }
      resolve();
    });
  });
}

initializeAuthObserver();

export { db, auth };