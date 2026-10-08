import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from '../src/components/PrivateRoute';

function setup(role) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<PrivateRoute role={role} />}>
          <Route path="/protected" element={<div>Protected</div>} />
        </Route>
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

//вход без токена
test('без токена направляем пользователя на /login', () => {
  setup();
  expect(screen.getByText('Login')).toBeInTheDocument();
});

//проверяем вход на фронт по фейковому токену (при любом API-запросе к бэкэнду будет 401 ошибка)
test('с валидным токеном рендерит защищённый контент', () => {
  const payload = btoa(JSON.stringify({
    role: 'administrator',
    exp: Math.floor(Date.now() / 1000) + 3600,
  }));
  localStorage.setItem('token', `x.${payload}.y`);

  setup('administrator');
  expect(screen.getByText('Protected')).toBeInTheDocument();
});

//попытка входа в админку под обычным пользователем
test('с ролью guest на /admin редиректит на /', () => {
  const payload = btoa(JSON.stringify({
    role: 'guest',
    exp: Math.floor(Date.now() / 1000) + 3600,
  }));
  localStorage.setItem('token', `x.${payload}.y`);

  setup('administrator');
  expect(screen.getByText('Home')).toBeInTheDocument();
});