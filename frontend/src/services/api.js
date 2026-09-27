const API_URL = '/api';

// Общая обёртка над fetch: подставляет токен, ловит 401 и редиректит на /login
async function request(path, options = {}) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // 401 = токен протух/невалиден. Исключаем /auth/login, чтобы при неверном
  // пароле не выкидывало на ту же страницу и не терялось сообщение об ошибке.
  if (response.status === 401 && path !== '/auth/login') {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Неавторизован');
  }

  if (!response.ok) throw new Error('Ошибка запроса к серверу');

  return response.json();
}

// GET-запрос
export function apiGet(path) {
  return request(path);
}

// POST-запрос
export function apiPost(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}