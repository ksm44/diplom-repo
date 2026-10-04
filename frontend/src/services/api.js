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

  // 204 No Content → нет тела → ничего не возвращаем (чтобы не было ошибок)
  if (response.status === 204) return null;

  return response.json();
}

// GET-запрос
export function apiGet(path) {
  return request(path);
}

// DELETE-запрос
export function apiDelete(path) {
  return request(path, { method: 'DELETE' });
}

// POST-запрос с application/json
export function apiPost(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// PATCH-запрос
export function apiPatch(path, body) {
  return request(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// POST-запрос с multipart/form-data (для загрузки картинок постеров фильмов)
export function apiUpload(path, file) {
  const token = localStorage.getItem('token');
  const form = new FormData();
  form.append('file', file);
  return fetch(`/api${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  }).then((r) => {
    if (!r.ok) throw new Error('Ошибка загрузки');
    return r.json();
  });
}