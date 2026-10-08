import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { apiPost } from '../services/api';

export default function RegisterPage() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) {
        localStorage.removeItem('token');
      } else {
        return <Navigate to="/" replace />;
      }
    } catch {
      localStorage.removeItem('token');
    }
  }

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const data = await apiPost('/auth/register', { username, password });
      localStorage.setItem('token', data.access_token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Не удалось зарегистрироваться');
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Идём<span>в</span>кино</h1>
        </div>
      </header>
      <main>
        <section className="login">
          <header className="login__header">
            <h2 className="login__title">Регистрация</h2>
          </header>
          <div className="login__wrapper">
            <form className="login__form" onSubmit={handleSubmit}>
              <label className="login__label" htmlFor="username">
                Логин
                <input
                  className="login__input"
                  type="text"
                  placeholder="admin@admin.ru"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                <input value="Зарегистрироваться" type="submit" className="login__button" />
              </div>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <p style={{ marginTop: 16, fontSize: '1.4rem' }}>
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}