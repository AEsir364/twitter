import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import Header from './components/Header';
import NewPostButton from './components/NewPostButton';
import PostCreationModal from './components/PostCreationModal';

// Firebase imports
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPostCreationModal, setShowPostCreationModal] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState(null);
  const [currentUserProfileName, setCurrentUserProfileName] = useState('Convidado');
  const [currentUserPhotoURL, setCurrentUserPhotoURL] = useState('');
  const [loadingAuthAndProfile, setLoadingAuthAndProfile] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Monitors authentication state and fetches user profile data.
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentUserUid(user.uid);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUserProfileName(userDocSnap.data().profileName);
            setCurrentUserPhotoURL(userDocSnap.data().photoURL && userDocSnap.data().photoURL !== '' ? userDocSnap.data().photoURL : "https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
          } else {
            setCurrentUserProfileName(user.uid);
            setCurrentUserPhotoURL("https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
            console.warn("Documento de perfil do usuário não encontrado no Firestore para UID:", user.uid);
          }
        } catch (error) {
          console.error("Erro ao buscar nome/foto de perfil:", error);
          setCurrentUserProfileName(user.uid);
          setCurrentUserPhotoURL("https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUserUid(null);
        setCurrentUserProfileName('Convidado');
        setCurrentUserPhotoURL("https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
      }
      setLoadingAuthAndProfile(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Protects routes, redirecting unauthenticated users.
  useEffect(() => {
    // Se não estiver carregando, não autenticado, e a rota NÃO for login/cadastro, redireciona
    if (!loadingAuthAndProfile && !isAuthenticated && 
        location.pathname !== '/login' && location.pathname !== '/signup') {
      navigate('/login');
    }
  }, [loadingAuthAndProfile, isAuthenticated, location.pathname, navigate]);

  const togglePostCreationModal = () => {
    if (!isAuthenticated) {
      alert("Você precisa estar logado para criar uma publicação.");
      navigate('/login');
      return;
    }
    setShowPostCreationModal(prev => !prev);
  };

  // Define quais páginas NÃO devem ter Header/NewPostButton (apenas login/cadastro)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (loadingAuthAndProfile) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#15202B', color: '#e0e0e0' }}>Carregando...</div>;
  }

  return (
    <>
      {/* Renderiza o Header em todas as páginas, EXCETO login/cadastro */}
      {!isAuthPage && <Header />}
      
      <Routes>
        {/* Rota raiz agora é o FeedPage, mas protegida */}
        <Route path="/" element={isAuthenticated ? <FeedPage /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        {/* FeedPage e ProfilePage continuam protegidas, mas FeedPage é o default */}
        <Route path="/feed" element={isAuthenticated ? <FeedPage /> : <Navigate to="/login" replace />} />
        <Route path="/profile/:userId" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />} />
        {/* Redireciona qualquer rota não encontrada para o feed (se logado) ou login (se não logado) */}
        <Route path="*" element={isAuthenticated ? <Navigate to="/feed" replace /> : <Navigate to="/login" replace />} />
      </Routes>

      {/* Renderiza o botão de nova publicação APENAS se não for página de auth E estiver logado */}
      {!isAuthPage && isAuthenticated && (
        <NewPostButton onNewPostClick={togglePostCreationModal} />
      )}

      {/* Renderiza o modal de criação de post APENAS se não estiver carregando E estiver logado */}
      {!loadingAuthAndProfile && isAuthenticated && (
        <PostCreationModal
          isOpen={showPostCreationModal}
          onClose={() => setShowPostCreationModal(false)}
          currentUserUid={currentUserUid}
          currentUserProfileName={currentUserProfileName}
          currentUserPhotoURL={currentUserPhotoURL}
        />
      )}
    </>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default AppRoutes;