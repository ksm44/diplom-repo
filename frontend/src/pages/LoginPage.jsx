import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../services/api';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) { // если токен истёк удаляем его
        localStorage.removeItem('token');
      } else {
        return <Navigate to="/" replace />; // редиректим на homePage
      }
    } catch {
      localStorage.removeItem('token'); // битый токен удаляем
    }
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const data = await apiPost('/auth/login', { username: email, password });
      localStorage.setItem('token', data.access_token);
      navigate('/admin');
    } catch {
      setError('Неверный логин или пароль');
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Идём<span>в</span>кино</h1>
          <span className="page-header__subtitle">Администраторррская</span>
        </div>
      </header>
      <main>
        <section className="login">
          <header className="login__header">
            <h2 className="login__title">Авторизация</h2>
          </header>
          <div className="login__wrapper">
            <form className="login__form" onSubmit={handleSubmit}>
              <label className="login__label" htmlFor="email">
                E-mail
                <input
                  className="login__input"
                  type="email"
                  placeholder="example@domain.xyz"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="login__label" htmlFor="pwd">
                Пароль
                <input
                  className="login__input"
                  type="password"
                  id="pwd"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <div className="text-center">
                <input value="Авторизоваться" type="submit" className="login__button" />
              </div>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </div>
        </section>
      </main>
    </>
  );
}