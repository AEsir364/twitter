import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './SignupPage.module.css';
import Botao from '../../components/Botao';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import SHA256 from 'crypto-js/sha256';

function SignupPage() {
  const [username, setUsername] = useState('');
  const [profileName, setProfileName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const logoPath = "/Images/Logo.png";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (username.length < 3) {
      setErrorMessage('O nome de usuário deve ter pelo menos 3 caracteres.');
      return;
    }
    if (profileName.length < 3) {
      setErrorMessage('O nome de perfil deve ter pelo menos 3 caracteres.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    const email = username.includes('@') ? username : `${username}@twitterclone.com`;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const hashedPassword = SHA256(password).toString();

      await setDoc(doc(db, "users", user.uid), {
        username: username,
        profileName: profileName,
        passwordHash: hashedPassword,
        createdAt: serverTimestamp(),
        photoURL: "https://placehold.co/150x150/1DA1F2/ffffff?text=No+Photo",
        bio: "",
        followers: {},
        following: {},
      });

      setSuccessMessage('Conta criada com sucesso! Redirecionando para o login...');
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error("Erro ao criar conta:", error.code, error.message);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setErrorMessage('Este nome de usuário (email) já está em uso.');
          break;
        case 'auth/invalid-email':
          setErrorMessage('Formato de nome de usuário (email) inválido.');
          break;
        case 'auth/weak-password':
          setErrorMessage('A senha é muito fraca. Escolha uma senha mais forte.');
          break;
        default:
          setErrorMessage('Erro ao criar conta. Tente novamente mais tarde.');
          break;
      }
    }
  };

  return (
    <div className={styles.signupPageWrapper}>
      <div className={styles.signupContainer}>
        <img src={logoPath} alt="Twitter Clone Logo" className={styles.logo} />
        <h1 className={styles.signupTitle}>Crie sua conta</h1>
        <p className={styles.signupSubtitle}>Junte-se à nossa comunidade!</p>

        <form onSubmit={handleSubmit} className={styles.signupForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>Nome de Usuário (Será seu login)</label>
            <input
              type="text"
              id="username"
              className={styles.input}
              placeholder="garel_do_mel"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="profileName" className={styles.label}>Nome de Perfil</label>
            <input
              type="text"
              id="profileName"
              className={styles.input}
              placeholder="Alandro"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Senha</label>
            <input
              type="password"
              id="password"
              className={styles.input}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirmar Senha</label>
            <input
              type="password"
              id="confirmPassword"
              className={styles.input}
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
          {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

          <Botao type="submit">Cadastrar</Botao>
        </form>

        <p className={styles.signupSubtitle} style={{ marginTop: '20px', fontSize: '14px' }}>
          Já tem uma conta?{' '}
          <Link to="/login" className={styles.loginLink}>
            Fazer Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;