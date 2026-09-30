//для редиректа на на /login если принимается попытка входа на любой путь без авторизации
import { Navigate, Outlet } from 'react-router-dom';


export default function PrivateRoute({ role }) {
  const token = localStorage.getItem('token');

  if (!token) return <Navigate to="/login" replace />;

  let payload;
  try {
    payload = JSON.parse(atob(token.split('.')[1]));
  } catch {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // проверка срока действия токена
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // проверка роли (если задана)
  if (role && payload.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}