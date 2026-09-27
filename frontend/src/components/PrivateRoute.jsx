//для редиректа на на /login если принимается попытка входа на любой путь без авторизации
import { Navigate, Outlet } from 'react-router-dom';


export default function PrivateRoute({ role }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  // если задана требуемая роль — проверяем её из payload токена
  if (role) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      //если роль не administrator → на homepage
      if (payload.role !== role) return <Navigate to="/" replace />;
    } catch {
      // токен битый/нечитаемый — выкидываем на логин
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}