import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginPage.module.css';
import Botao from '../../components/Botao';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const logoPath = "/Images/Logo.png";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    const email = username.includes('@') ? username : `${username}@twitterclone.com`;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      console.log('Login bem-sucedido para:', username);
      navigate('/feed');
    } catch (error) {
      console.error("Erro ao fazer login:", error.code, error.message);
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setErrorMessage('Nome de usuário ou senha inválidos. Tente novamente.');
          break;
        case 'auth/invalid-email':
          setErrorMessage('Formato de nome de usuário (email) inválido.');
          break;
        default:
          setErrorMessage('Erro ao fazer login. Tente novamente mais tarde.');
          break;
      }
      setUsername('');
      setPassword('');
    }
  };

  return (
    <div className={styles.loginPageWrapper}>
      <div className={styles.loginContainer}>
        
        <img src={logoPath} alt="Twitter Clone Logo" className={styles.logo} />
        <h1 className={styles.neutralTitle}>Acesse sua conta</h1>
        <p className={styles.neutralSubtitle}>Insira suas credenciais para continuar.</p>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>Usuário</label>
            <input
              type="text"
              id="username"
              className={styles.input}
              placeholder="seu_usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Senha</label>
            <input
              type="password"
              id="password"
              className={styles.input}
              placeholder="sua_senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
          <Botao type="submit">Entrar</Botao>
        </form>

        <p className={styles.neutralSubtitle} style={{ marginTop: '20px', fontSize: '14px' }}>
          Não tem uma conta?{' '}
          <Link to="/signup" className={styles.signupLink}>
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;