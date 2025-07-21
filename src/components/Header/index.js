import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FiLogOut } from 'react-icons/fi';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUserUid, setCurrentUserUid] = useState(null);
  const [profilePhotoURL, setProfilePhotoURL] = useState('');

  // Monitors authentication state and fetches user profile photo.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserUid(user.uid);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data().photoURL && userDocSnap.data().photoURL !== '') {
            setProfilePhotoURL(userDocSnap.data().photoURL);
          } else {
            setProfilePhotoURL("https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
          }
        } catch (error) {
          console.error("Erro ao buscar foto de perfil no header:", error);
          setProfilePhotoURL("https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
        }
      } else {
        setCurrentUserUid(null);
        setProfilePhotoURL("https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogoClick = () => {
    if (location.pathname === '/feed') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/feed');
    }
  };

  const handleProfileClick = () => {
    if (currentUserUid) {
      navigate(`/profile/${currentUserUid}`);
    } else {
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Usuário deslogado com sucesso!");
      navigate('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const logoPath = "/Images/Logo.png";

  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <header className={styles.headerContainer}>
      <button className={styles.profileButton} onClick={handleProfileClick}>
        <img src={profilePhotoURL} alt="Foto de Perfil" className={styles.profileImage} />
      </button>
      <button className={styles.logoButton} onClick={handleLogoClick}>
        <img src={logoPath} alt="Logo X" className={styles.logo} />
      </button>
      <button className={styles.logoutButton} onClick={handleLogout}>
        <FiLogOut size={20} />
      </button>
    </header>
  );
}

export default Header;